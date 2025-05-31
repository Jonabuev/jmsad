import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.linear_model import LogisticRegression as log


# Данные о пользователях
users_data = [
    ('individual', '123456789012', 'tenant'),
    ('individual', '234567890123', 'tenant'),
    ('individual', '345678901234', 'tenant'),
    ('individual', '456789012345', 'tenant'),
    ('individual', '567890123456', 'tenant'),
    ('individual', '678901234567', 'tenant'),
    ('individual', '789012345678', 'tenant'),
    ('individual', '890123456789', 'tenant'),
    ('individual', '901234567890', 'tenant'),
    ('individual', '102345678901', 'tenant'),
    ('individual', '501234567890', 'tenant'),
    ('individual', '512345678901', 'tenant'),
    ('individual', '523456789012', 'tenant'),
    ('individual', '534567890123', 'tenant'),
    ('individual', '545678901234', 'tenant'),
    ('individual', '601234567890', 'tenant'),
    ('individual', '612345678901', 'tenant'),
    ('individual', '623456789012', 'tenant'),
    ('individual', '634567890123', 'tenant'),
    ('individual', '645678901234', 'tenant'),
    ('individual', '656789012345', 'tenant'),
    ('individual', '667890123456', 'tenant'),
    ('individual', '678901234567', 'tenant'),
    ('individual', '689012345678', 'tenant'),
    ('individual', '701234567890', 'tenant'),
    ('individual', '712345678901', 'tenant'),
    ('individual', '723456789012', 'tenant'),
    ('individual', '734567890123', 'tenant'),
    ('individual', '745678901234', 'tenant'),
    ('individual', '756789012345', 'tenant'),
    ('individual', '767890123456', 'tenant'),
    ('individual', '778901234567', 'tenant'),
    ('individual', '789012345678', 'tenant'),
    ('individual', '801234567890', 'tenant'),
    ('individual', '812345678901', 'tenant'),
    ('individual', '823456789012', 'tenant'),
    ('individual', '834567890123', 'tenant'),
    ('individual', '845678901234', 'tenant'),
    ('individual', '856789012345', 'tenant')
]

complaints_data = [
    ('123456789012', 'late_payment'),
    ('123456789012', 'property_damage'),
    ('234567890123', 'contract_violation'),
    ('234567890123', 'neighbor_complaints'),
    ('345678901234', 'property_damage'),
    ('345678901234', 'late_payment'),
    ('456789012345', 'contract_violation'),
    ('456789012345', 'late_payment'),
    ('567890123456', 'property_damage'),
    ('567890123456', 'neighbor_complaints'),
    ('678901234567', 'late_payment'),
    ('678901234567', 'contract_violation'),
    ('789012345678', 'property_damage'),
    ('789012345678', 'neighbor_complaints'),
    ('890123456789', 'late_payment'),
    ('890123456789', 'contract_violation'),
    ('901234567890', 'property_damage'),
    ('901234567890', 'neighbor_complaints'),
    ('102345678901', 'late_payment'),
    ('102345678901', 'contract_violation'),
    ('501234567890', 'property_damage'),
    ('501234567890', 'neighbor_complaints'),
    ('512345678901', 'late_payment'),
    ('512345678901', 'contract_violation'),
    ('523456789012', 'property_damage'),
    ('523456789012', 'neighbor_complaints'),
    ('534567890123', 'late_payment'),
    ('534567890123', 'contract_violation'),
    ('545678901234', 'property_damage'),
    ('545678901234', 'neighbor_complaints'),
    ('601234567890', 'late_payment'),
    ('601234567890', 'contract_violation'),
    ('612345678901', 'property_damage'),
    ('612345678901', 'neighbor_complaints'),
    ('623456789012', 'late_payment'),
    ('623456789012', 'contract_violation'),
    ('634567890123', 'property_damage'),
    ('634567890123', 'neighbor_complaints')
]

# --- Вес жалоб ---
COMPLAINT_WEIGHTS = {
    'late_payment': 1,
    'property_damage': 4,
    'contract_violation': 3,
    'neighbor_complaints': 2
}

# --- Преобразование данных в DataFrame ---
users_df = pd.DataFrame(users_data, columns=['entity_type', 'identifier', 'role'])
complaints_df = pd.DataFrame(complaints_data, columns=['tenant_identifier', 'reason'])

users_df['identifier'] = users_df['identifier'].astype(str)
complaints_df['tenant_identifier'] = complaints_df['tenant_identifier'].astype(str)
complaints_df['weight'] = complaints_df['reason'].map(COMPLAINT_WEIGHTS)

# --- Подсчёт количества и суммы баллов ---
complaints_count = complaints_df.groupby('tenant_identifier').size().reset_index(name='complaint_count')
complaints_score = complaints_df.groupby('tenant_identifier')['weight'].sum().reset_index(name='complaint_score')

# --- Объединение с пользователями ---
merged_df = users_df.merge(complaints_count, left_on='identifier', right_on='tenant_identifier', how='left')\
                    .merge(complaints_score, on='tenant_identifier', how='left')\
                    .fillna({'complaint_count': 0, 'complaint_score': 0})

# --- Расчёт рейтинга ---
def calculate_rating(score):
    if score == 0: return 5
    elif score <= 2: return 4
    elif score <= 4: return 3
    elif score <= 6: return 2
    else: return 1

merged_df['rating'] = merged_df['complaint_score'].apply(calculate_rating)

# --- Расчёт благонадежности ---
def calculate_reliability(row):
    return int(row['complaint_count'] > 3 or row['rating'] <= 2)

merged_df['reliability'] = merged_df.apply(calculate_reliability, axis=1)

# --- Подготовка данных для моделей ---
X = merged_df[['complaint_count', 'complaint_score', 'rating']]
y = merged_df['reliability']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- Обучение моделей ---
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

knn_model = KNeighborsClassifier(n_neighbors=3)
knn_model.fit(X_train, y_train)


logreg_model = log(max_iter=1000, random_state=42)
logreg_model.fit(X_train, y_train)


# --- Сохранение моделей ---
with open('rental_models1.pkl', 'wb') as f:
    pickle.dump({
        'rf_model': rf_model,
        'knn_model': knn_model,
        'logreg_model': logreg_model
    }, f)

print("Модели успешно обучены и сохранены в rental_models.pkl")

# --- Предсказания и сравнение ---
for index, row in merged_df.iterrows():
    sample = row[['complaint_count', 'complaint_score', 'rating']].to_frame().T
    rf_pred = rf_model.predict(sample)[0]
    knn_pred = knn_model.predict(sample)[0]
    if rf_pred != knn_pred:
        print(f"⚠️ Разные предсказания в записи {index}: RF={rf_pred}, KNN={knn_pred}")

# --- Топ благонадежных арендаторов ---
top_10 = merged_df[merged_df['reliability'] == 0].sort_values(
    by=['rating', 'complaint_count'], ascending=[False, True]
).head(10)

print("\nТоп 10 благонадежных арендаторов:")
print(top_10[['identifier', 'complaint_count', 'complaint_score', 'rating']])

# --- Рекомендательная функция ---
def recommend_tenants(requested_complaints=0, min_recommended=15):
    reliable = merged_df[merged_df['reliability'] == 0]
    if len(reliable) < min_recommended:
        additional = merged_df[
            (merged_df['complaint_count'] <= requested_complaints) & (merged_df['reliability'] == 1)
        ].sort_values(by='complaint_count').head(min_recommended - len(reliable))
        reliable = pd.concat([reliable, additional])
    return reliable[['identifier', 'complaint_count']]

# --- Вывод рекомендованных арендаторов ---
recommended = recommend_tenants(min_recommended=15)
print("\nРекомендованные арендаторы:")
print(recommended)

# --- Accuracy моделей ---
print("\n=== Accuracy ===")
print("Random Forest:", accuracy_score(y_test, rf_model.predict(X_test)))
print("KNN:", accuracy_score(y_test, knn_model.predict(X_test)))
print("Logistic Regression:", accuracy_score(y_test, logreg_model.predict(X_test)))