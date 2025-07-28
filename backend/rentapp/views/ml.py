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
from PIL import Image
import base64



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

        try:
            # Автоматически заполняем поля имени пользователя
            auto_fill_user_name_fields(request.user)
            
            # Извлекаем текст из изображения
            extracted_text = extract_text(image).lower()
            print("📄 Extracted text:\n", extracted_text)
            print("📄 Длина извлеченного текста:", len(extracted_text))
            print("📄 Первые 500 символов:", extracted_text[:500])
            
            # Ищем MRZ зону (машиночитаемая зона) - обычно содержит имя в латинском формате
            mrz_lines = []
            for line in extracted_text.split('\n'):
                if '<<<' in line or 'abuev' in line.lower() or 'janibek' in line.lower():
                    mrz_lines.append(line.strip())
                    print(f"🔍 Найдена MRZ строка: {line.strip()}")
            
            if mrz_lines:
                print(f"📋 MRZ зона найдена: {mrz_lines}")

            # --- НОВАЯ СИСТЕМА ПРОВЕРКИ ПО ПОЛЯМ ---
            user = request.user
            print(f"👤 Проверяем пользователя: {user.username}")
            print(f"📝 Данные пользователя:")
            print(f"   Фамилия: {user.last_name}")
            print(f"   Имя: {user.first_name}")
            print(f"   Отчество: {user.thirdname}")
            print(f"   ИИН: {user.identifier}")
            
            # Собираем все поля для проверки
            fields_to_check = {
                'last_name': user.last_name,
                'first_name': user.first_name, 
                'thirdname': user.thirdname,
                'identifier': user.identifier,
                'username': user.username
            }
            
            # Удаляем пустые поля
            fields_to_check = {k: v for k, v in fields_to_check.items() if v}
            
            print(f"🔍 Проверяем поля: {list(fields_to_check.keys())}")
            
            # Проверяем каждое поле отдельно
            field_matches = {}
            total_found = 0
            
            for field_name, field_value in fields_to_check.items():
                if not field_value:
                    continue
                    
                # Создаем варианты для поиска
                search_terms = [field_value.lower()]
                
                # Специальная обработка для отчества
                if field_name == 'thirdname':
                    # Разбиваем отчество на части
                    thirdname_parts = field_value.lower().split()
                    if len(thirdname_parts) >= 2:
                        # Добавляем варианты: слитно, раздельно, только первая часть
                        thirdname_variants = [
                            ''.join(thirdname_parts),  # слитно
                            ' '.join(thirdname_parts),  # раздельно
                            thirdname_parts[0],  # только первая часть
                            thirdname_parts[-1]  # только последняя часть
                        ]
                        
                        # Добавляем комбинации частей (для случаев типа "Кайрат улы", "Кайрат кызы")
                        if len(thirdname_parts) >= 2:
                            # Добавляем комбинации: "кайрат улы", "кайрат кызы"
                            thirdname_variants.append(f"{thirdname_parts[0]} {thirdname_parts[1]}")
                            thirdname_variants.append(f"{thirdname_parts[1]} {thirdname_parts[0]}")
                            
                            # Добавляем слитные варианты: "кайратулы", "кайраткызы"
                            thirdname_variants.append(f"{thirdname_parts[0]}{thirdname_parts[1]}")
                            thirdname_variants.append(f"{thirdname_parts[1]}{thirdname_parts[0]}")
                        
                        # Добавляем транслитерированные варианты для каждой части
                        for part in thirdname_parts:
                            translit_part = ''
                            for char in part:
                                translit_part += translit_map.get(char, char)
                            thirdname_variants.append(translit_part)
                        
                        # Добавляем транслитерированное полное отчество
                        translit_full = ''
                        for char in field_value.lower():
                            translit_full += translit_map.get(char, char)
                        thirdname_variants.append(translit_full)
                        
                        # Добавляем транслитерированные комбинации
                        if len(thirdname_parts) >= 2:
                            translit_first = ''
                            for char in thirdname_parts[0]:
                                translit_first += translit_map.get(char, char)
                            translit_second = ''
                            for char in thirdname_parts[1]:
                                translit_second += translit_map.get(char, char)
                            
                            thirdname_variants.extend([
                                f"{translit_first} {translit_second}",  # "kuandyk uly"
                                f"{translit_second} {translit_first}",  # "uly kuandyk"
                                f"{translit_first}{translit_second}",   # "kuandykuly"
                                f"{translit_second}{translit_first}"    # "ulykuandyk"
                            ])
                        
                        # Добавляем специальные варианты для казахских отчеств
                        special_variants = [
                            'улы', 'кызы', 'улы', 'кызы',  # казахские суффиксы
                            'uly', 'kyzy', 'uly', 'kyzy'   # латинские варианты
                        ]
                        thirdname_variants.extend(special_variants)
                        
                        search_terms.extend(thirdname_variants)
                        print(f"🔍 Варианты отчества '{field_value}' для поиска: {thirdname_variants[:8]}...")  # Показываем первые 8
                
                # Добавляем транслитерированные варианты (только если еще не добавлены)
                if field_name != 'thirdname':  # Для отчества транслитерация уже добавлена выше
                    translit_map = {
                        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
                        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
                        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
                        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
                        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
                    }
                    
                    translit_value = ''
                    for char in field_value.lower():
                        translit_value += translit_map.get(char, char)
                    search_terms.append(translit_value)
                
                # Специальная обработка для фамилии
                if field_name == 'last_name':
                    # Добавляем частичные варианты для фамилии
                    if len(field_value) > 3:
                        search_terms.append(field_value.lower()[:3])
                        search_terms.append(field_value.lower()[:4])
                    
                    print(f"🔍 Варианты фамилии '{field_value}' для поиска: {search_terms[:5]}...")  # Показываем первые 5
                
                # Для имени добавляем варианты с возможными ошибками OCR
                if field_name == 'first_name':
                    # Создаем универсальные варианты для любого имени
                    name_variants = [field_value.lower()]
                    
                    # Добавляем транслитерированные варианты
                    translit_name = ''
                    for char in field_value.lower():
                        translit_name += translit_map.get(char, char)
                    name_variants.append(translit_name)
                    
                    # Добавляем варианты с возможными ошибками OCR
                    common_ocr_errors = {
                        'ж': 'zh', 'и': 'i', 'е': 'e', 'н': 'n', 'б': 'b', 'к': 'k',
                        'а': 'a', 'в': 'v', 'г': 'g', 'д': 'd', 'ё': 'yo', 'з': 'z',
                        'й': 'y', 'л': 'l', 'м': 'm', 'о': 'o', 'п': 'p', 'р': 'r',
                        'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
                        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
                        'э': 'e', 'ю': 'yu', 'я': 'ya'
                    }
                    
                    # Создаем варианты с ошибками OCR
                    for old_char, new_char in common_ocr_errors.items():
                        if old_char in field_value.lower():
                            error_variant = field_value.lower().replace(old_char, new_char)
                            name_variants.append(error_variant)
                    
                    # Добавляем частичные варианты (первые 3-4 буквы)
                    if len(field_value) > 3:
                        name_variants.append(field_value.lower()[:3])
                        name_variants.append(field_value.lower()[:4])
                    
                    search_terms.extend(name_variants)
                    print(f"🔍 Варианты имени '{field_value}' для поиска: {name_variants[:5]}...")  # Показываем первые 5
                
                # Ищем в основном тексте
                found_terms = search_text_anywhere(extracted_text, search_terms)
                
                # Ищем в MRZ зоне
                if mrz_lines:
                    mrz_text = ' '.join(mrz_lines).lower()
                    mrz_found = search_text_anywhere(mrz_text, search_terms)
                    found_terms.extend(mrz_found)
                
                field_matches[field_name] = found_terms
                if found_terms:
                    total_found += 1
                    print(f"✅ Поле '{field_name}' найдено: {found_terms}")
                else:
                    print(f"❌ Поле '{field_name}' не найдено")
                    # Отладочная информация для отчества
                    if field_name == 'thirdname':
                        print(f"🔍 Отладочная информация для отчества '{field_value}':")
                        print(f"   Искали варианты: {search_terms[:10]}...")
                        print(f"   В тексте есть слова: {[word for word in extracted_text.split() if len(word) > 2][:10]}...")
                        print(f"   В MRZ зоне: {mrz_text if mrz_lines else 'Нет MRZ'}")
            
            print(f"📊 Найдено полей: {total_found}/{len(fields_to_check)}")
            
            # Определяем успешность верификации
            # Нужно найти минимум 2 поля или 60% от доступных полей
            min_required = max(2, len(fields_to_check) * 0.6)
            verification_success = total_found >= min_required
            
            print(f"🎯 Требуется найти: {min_required} полей")
            print(f"✅ Верификация успешна: {verification_success}")
            
            # --- Проверка ИИН ---
            identifier_match = False
            if user.identifier:
                identifier_variants = set()
                identifier = user.identifier
                
                # Добавляем оригинальный ИИН
                identifier_variants.add(identifier)
                
                # Добавляем варианты с разделителями
                identifier_variants.add(identifier.replace(' ', ''))
                identifier_variants.add(identifier.replace('-', ''))
                identifier_variants.add(identifier.replace('.', ''))
                identifier_variants.add(identifier.replace('_', ''))
                
                # Добавляем частичные совпадения (первые 6, 4, 3 цифры)
                if len(identifier) >= 6:
                    identifier_variants.add(identifier[:6])
                if len(identifier) >= 4:
                    identifier_variants.add(identifier[:4])
                if len(identifier) >= 3:
                    identifier_variants.add(identifier[:3])
                
                # Добавляем последние цифры
                if len(identifier) >= 4:
                    identifier_variants.add(identifier[-4:])
                if len(identifier) >= 3:
                    identifier_variants.add(identifier[-3:])
                
                identifier_match = any(variant in extracted_text for variant in identifier_variants)
                print(f"🆔 Identifier match: {identifier_match}")
                print(f"🔍 Искали ИИН: {list(identifier_variants)[:5]}...")  # Показываем первые 5
            
            # --- Проверка даты истечения ---
            expiry_is_valid = True  # По умолчанию считаем валидной
            visa_match = True  # По умолчанию считаем валидной
            
            if user.passport_expiry:
                expected_date = user.passport_expiry.strftime('%d.%m.%Y')
                print(f"📅 Ожидаемая дата истечения: {expected_date}")
                
                # Ищем даты в тексте
                date_patterns = [
                    r'\d{2}\.\d{2}\.\d{4}',  # DD.MM.YYYY
                    r'\d{2}/\d{2}/\d{4}',     # DD/MM/YYYY
                    r'\d{2}-\d{2}-\d{4}',     # DD-MM-YYYY
                    r'\d{4}-\d{2}-\d{2}',     # YYYY-MM-DD
                ]
                
                found_dates = []
                for pattern in date_patterns:
                    dates = re.findall(pattern, extracted_text)
                    found_dates.extend(dates)
                
                print(f"📅 Найденные даты: {found_dates}")
                
                if found_dates:
                    # Проверяем, есть ли ожидаемая дата среди найденных
                    expiry_match = expected_date in found_dates
                    print(f"📅 Дата истечения найдена: {expiry_match}")
                else:
                    print("📅 Даты не найдены в документе")
            
            # --- Финальная проверка ---
            # Верификация успешна, если:
            # 1. Найдено достаточно полей ИЛИ
            # 2. Найден ИИН и есть валидная дата
            final_success = verification_success or (identifier_match and expiry_is_valid and visa_match)
            
            print(f"🎯 Финальный результат: {final_success}")
            
            if final_success:
                # Создаем или обновляем запись верификации
                verification, created = IdentityVerification.objects.get_or_create(
                    user=request.user,
                    defaults={'verified': True}
                )
                if not created:
                    verification.verified = True
                    verification.save()
                
                return Response({
                    'success': True,
                    'message': 'Документ успешно верифицирован!',
                    'verification_id': verification.id
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': 'Документ не прошел автоматическую верификацию. Обратитесь к администратору для ручной проверки.',
                    'extracted_text_preview': extracted_text[:500],
                    'suggestions': [
                        'Убедитесь, что документ четкий и хорошо освещен',
                        'Проверьте, что все данные на документе читаемы',
                        'Попробуйте загрузить документ снова'
                    ],
                    'field_matches': field_matches,
                    'total_found': total_found,
                    'min_required': min_required
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"❌ Ошибка при обработке изображения: {e}")
            return Response({
                'success': False,
                'message': f'Ошибка при обработке изображения: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


def auto_fill_user_name_fields(user):
    """
    Автоматически заполняет поля first_name, last_name, thirdname из username
    """
    if not user.username:
        return False
    
    # Разбиваем username на части
    name_parts = user.username.strip().split()
    print(f"🔍 Разбиваем username '{user.username}' на части: {name_parts}")
    
    if len(name_parts) >= 1:
        user.last_name = name_parts[0]  # Фамилия
    
    if len(name_parts) >= 2:
        user.first_name = name_parts[1]  # Имя
    
    if len(name_parts) >= 3:
        # Отчество - все оставшиеся части (может быть несколько слов)
        user.thirdname = ' '.join(name_parts[2:])  # Отчество
        print(f"🔍 Отчество будет: '{user.thirdname}' (из частей: {name_parts[2:]})")
    
    try:
        user.save()
        print(f"✅ Автоматически заполнены поля для пользователя {user.username}:")
        print(f"   Фамилия: {user.last_name}")
        print(f"   Имя: {user.first_name}")
        print(f"   Отчество: {user.thirdname}")
        return True
    except Exception as e:
        print(f"❌ Ошибка при заполнении полей: {e}")
        return False

def search_text_anywhere(text, search_terms):
    """
    Ищет любое из слов в любом месте текста
    """
    text_lower = text.lower()
    found_terms = []
    
    for term in search_terms:
        term_lower = term.lower()
        if term_lower in text_lower:
            found_terms.append(term)
            print(f"✅ Найдено слово: {term}")
        else:
            # Попробуем найти частичные совпадения для длинных слов
            if len(term_lower) > 3:
                # Ищем подстроки длиной не менее 3 символов
                for i in range(len(term_lower) - 2):
                    substring = term_lower[i:i+3]
                    if substring in text_lower:
                        found_terms.append(term)
                        print(f"✅ Найдено частичное совпадение: {term} (часть: {substring})")
                        break
            
            # Специальная обработка для отчеств - ищем каждую часть отдельно
            if ' ' in term_lower or len(term_lower) > 6:
                # Разбиваем на части и ищем каждую часть
                parts = term_lower.split()
                if len(parts) >= 2:
                    found_parts = 0
                    for part in parts:
                        if part in text_lower and len(part) > 2:
                            found_parts += 1
                            print(f"✅ Найдена часть отчества: {part}")
                    
                    # Если найдено больше половины частей, считаем успехом
                    if found_parts >= len(parts) * 0.5:
                        found_terms.append(term)
                        print(f"✅ Найдено отчество по частям: {term} ({found_parts}/{len(parts)} частей)")
    
    return found_terms






