import os
import pickle
import io
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, auc
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from rentapp.models import IdentityVerification, CustomUser, Complaint
from rentapp.serializers import ImageUploadSerializer
from .utils import extract_text, convert_file_to_image
import re
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
import pandas as pd


class ROCImageAPIView(APIView):
    def get(self, request):
        file_path = os.path.join("media", "bert_predictions.pkl")
        if not os.path.exists(file_path):
            return HttpResponse("Файл не найден", status=404)

        with open(file_path, "rb") as f:
            data = pickle.load(f)

        true_labels = data["true_labels"]
        probs = data["probs"][:, 1]  # вероятность "ненадёжного"

        # ROC
        fpr, tpr, _ = roc_curve(true_labels, probs)
        roc_auc = auc(fpr, tpr)

        # Построение графика
        plt.figure(figsize=(6, 4))
        plt.plot(fpr, tpr, color='blue', lw=2, label=f"AUC = {roc_auc:.2f}")
        plt.plot([0, 1], [0, 1], color='gray', linestyle='--')
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title("ROC-кривая BERT модели")
        plt.legend(loc="lower right")
        plt.tight_layout()

        # Сохранение в память
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        plt.close()
        buf.seek(0)

        return HttpResponse(buf.read(), content_type='image/png')

import re
from datetime import datetime

class OCRCheckView(APIView):
    def post(self, request, *args, **kwargs):
        print("Request data:", request.data)  
        print("Uploaded files:", request.FILES)  

        serializer = ImageUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES.get('id_document')
        if not uploaded_file:
            return Response({"error": "Файл не был загружен."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            image = convert_file_to_image(uploaded_file)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        extracted_text = extract_text(image).lower()
        print("📄 Extracted text:\n", extracted_text)

        # --- Проверка на ФИО ---
        username_match = request.user.username.lower() in extracted_text
        print(f"👤 Username match: {username_match}")

        # --- Проверка на ИИН/БИН, только если не виза или виза, но с identifier ---
        identifier = request.user.identifier
        skip_identifier_check = request.user.document_type == "visa" and not identifier

        if skip_identifier_check:
            identifier_match = True
            print("ℹ️ ИИН/БИН не требуется для документа типа 'visa'")
        else:
            identifier_match = identifier and identifier in extracted_text
            print(f"🆔 Identifier match: {identifier_match}")


        # --- Проверка срока действия паспорта ---
        expiry_date_str = request.user.passport_expiry.strftime('%d.%m.%Y')
        expiry_matches = re.findall(r"\d{2}[./-]\d{2}[./-]\d{4}", extracted_text)
        expiry_match = False
        expiry_is_valid = False

        for date_str in expiry_matches:
            try:
                doc_date = datetime.strptime(date_str.replace("-", ".").replace("/", "."), '%d.%m.%Y').date()
                if doc_date == request.user.passport_expiry:
                    expiry_match = True
                if doc_date >= datetime.today().date():
                    expiry_is_valid = True
            except ValueError:
                continue

        print(f"📅 Expiry match: {expiry_match}, Not expired: {expiry_is_valid}")

        # --- Проверка визы, если используется ---
        visa_match = True
        if request.user.document_type == "visa":
            visa_number = getattr(request.user, "visa_number", "")
            if visa_number:
                visa_match = visa_number in extracted_text
                print(f"🛂 Visa number match: {visa_match}")
            else:
                print("⚠️ Виза указана, но visa_number отсутствует")

        # --- Успешная верификация ---
        if username_match and identifier_match and expiry_match and expiry_is_valid and visa_match:
            try:
                with transaction.atomic():
                    request.user.email_confirmed = True
                    request.user.save()

                    IdentityVerification.objects.create(user=request.user, id_document=uploaded_file)

                    send_mail(
                        'Verification is completed successfully.',
                        'Thank you for submitting your identity document.',
                        settings.DEFAULT_FROM_EMAIL,
                        [request.user.email],
                        fail_silently=False,
                    )

                return Response({"message": "Identity verified successfully."}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": f"Ошибка при сохранении данных: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Если что-то не совпало:
        return Response({
            "error": "Документ не прошёл проверку.",
            "username_match": username_match,
            "identifier_match": identifier_match,
            "expiry_match": expiry_match,
            "expiry_valid": expiry_is_valid,
            "visa_match": visa_match,
        }, status=status.HTTP_400_BAD_REQUEST)


class RecommendTenantsAPIView(APIView):
    def load_predictions(self):
        try:
            with open(os.path.join("media", "bert_predictions.pkl"), "rb") as f:
                return pickle.load(f)
        except FileNotFoundError:
            return None
        except Exception as e:
            raise e

    def get(self, request):
        try:
            data = self.load_predictions()
            if data is None:
                return Response({"error": "Файл предсказаний не найден."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Ошибка при загрузке файла: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Формируем ответ
        result = []
        for i, text in enumerate(data.get("texts", [])):
            result.append({
                "index": i + 1,
                "description": text,
                "predicted_label": "Ненадёжный" if data["preds"][i] == 1 else "Надёжный",
                "prob_reliable": round(float(data["probs"][i][0]), 2),
                "prob_unreliable": round(float(data["probs"][i][1]), 2),
                "true_label": "Ненадёжный" if data["true_labels"][i] == 1 else "Надёжный",
            })

        return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
def evaluate_reliability(request):
    try:
        with open('rental_models1.pkl', 'rb') as f:
            models = pickle.load(f)
        rf_model = models['rf_model']
        knn_model = models['knn_model']
        logreg_model = models.get('logreg_model')
    except Exception as e:
        return Response({'error': f'Model load error: {str(e)}'}, status=500)

    COMPLAINT_WEIGHTS = {
        'Жалобы от соседей / нарушение порядка': 1,
        'Нарушение условий договора': 4,
        'Порча имущества': 3,
        'Просрочка платежей': 2,
    }

    def calculate_rating(score, count):
        if count == 0:
            return 5
        elif count == 1 and score <= 2:
            return 4
        elif count <= 2 and score <= 4:
            return 3
        elif count <= 3 or score <= 6:
            return 2
        else:
            return 1

    tenants = CustomUser.objects.filter(role='tenant', is_superuser=False)
    predictions = []

    for tenant in tenants:
        complaints = Complaint.objects.filter(tenant_identity=tenant).prefetch_related('reasons')

        all_weights = []
        for complaint in complaints:
            reasons = complaint.reasons.all()
            weights = [COMPLAINT_WEIGHTS.get(reason.reason, 0) for reason in reasons]
            all_weights.extend(weights)

        complaint_count = len(complaints)
        complaint_score = sum(all_weights)
        rating = calculate_rating(complaint_score, complaint_count)

        X = pd.DataFrame([{
            'complaint_count': complaint_count,
            'complaint_score': complaint_score,
            'rating': rating
        }])

        try:
            rf_pred = rf_model.predict(X)[0]
            knn_pred = knn_model.predict(X)[0]
            logreg_pred = logreg_model.predict(X)[0] if logreg_model else -1
        except Exception as e:
            rf_pred = knn_pred = logreg_pred = -1

        predictions.append({
            'username': tenant.username,
            'complaint_count': complaint_count,
            'complaint_score': complaint_score,
            'rating': rating,
            'rf_prediction': 'Reliable' if rf_pred == 0 else 'Unreliable',
            'knn_prediction': 'Reliable' if knn_pred == 0 else 'Unreliable',
            'logreg_prediction': 'Reliable' if logreg_pred == 0 else 'Unreliable',
        })
          # График предсказания по рейтингу на основе реальных данных
    graph_base64 = None
    if len(predictions) > 0:
        try:
            # ==== 1. Реальные данные ====
            df_real = pd.DataFrame([{
                'complaint_count': p['complaint_count'],
                'complaint_score': p['complaint_score'],
                'rating': p['rating']
            } for p in predictions])
            probs_real = logreg_model.predict_proba(df_real)[:, 1]
            df_real['prob_unreliable'] = probs_real

            avg_probs_by_rating = df_real.groupby('rating')['prob_unreliable'].mean().reset_index()

            # ==== 2. Теоретическая кривая ====
            df_theoretical = pd.DataFrame([{
                'complaint_count': 0,
                'complaint_score': 0,
                'rating': r
            } for r in range(1, 6)])
            probs_theoretical = logreg_model.predict_proba(df_theoretical)[:, 1]

            # ==== 3. Построение графика ====
            plt.figure()
            # Теоретическая кривая (линия)
            plt.plot(df_theoretical['rating'], probs_theoretical, label='LogReg кривая', linestyle='--', color='blue')
            # Реальные средние вероятности (точки)
            plt.scatter(avg_probs_by_rating['rating'], avg_probs_by_rating['prob_unreliable'], color='red', label='Средние вероятности')

            plt.title('Зависимость вероятности ненадёжности от рейтинга')
            plt.xlabel('Рейтинг')
            plt.ylabel('P(Ненадёжный)')
            plt.xticks(range(1, 6))
            plt.grid(True)
            plt.legend()

            buf = io.BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            graph_base64 = base64.b64encode(buf.read()).decode('utf-8')
            buf.close()
            plt.close()
        except Exception as e:
            print("Ошибка при построении графика:", str(e))
            graph_base64 = None

    return Response({
        'tenants_predictions': predictions,
        'rating_logreg_graph': graph_base64
    })






