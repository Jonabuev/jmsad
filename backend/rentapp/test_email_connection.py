import imaplib
import email
from decouple import config

def test_gmail_connection():
    email_user = config('EMAIL_HOST_USER', default='arno.help.service@gmail.com')
    email_password = config('EMAIL_HOST_PASSWORD')
    
    print(f"📧 Подключаемся к Gmail как: {email_user}")
    
    try:
        # Подключение к IMAP
        imap = imaplib.IMAP4_SSL('imap.gmail.com')
        print("✅ SSL соединение установлено")
        
        # Логин
        imap.login(email_user, email_password)
        print("✅ Авторизация успешна")
        
        # Выбор папки
        imap.select('INBOX')
        print("✅ Папка INBOX выбрана")
        
        # Поиск ВСЕХ писем
        status, messages = imap.search(None, 'ALL')
        email_ids = messages[0].split()
        print(f"📬 Всего писем в INBOX: {len(email_ids)}")
        
        # Поиск непрочитанных писем
        status, messages = imap.search(None, 'UNSEEN')
        unseen_ids = messages[0].split()
        print(f"📭 Непрочитанных писем: {len(unseen_ids)}")
        
        # ПРОВЕРЯЕМ ВСЕ ПИСЬМА, А НЕ ТОЛЬКО ПОСЛЕДНИЕ 10
        print("\n🔍 Проверка всех писем на наличие PDF...")
        pdf_emails = []
        
        for idx, email_id in enumerate(email_ids, 1):
            try:
                status, msg_data = imap.fetch(email_id, '(RFC822)')
                email_body = msg_data[0][1]
                message = email.message_from_bytes(email_body)
                
                # Получаем информацию о письме
                subject = decode_header_value(message['Subject'])
                sender = decode_header_value(message['From'])
                date = message['Date']
                
                # Проверяем все части письма
                has_pdf = False
                pdf_files = []
                
                for part in message.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get('Content-Disposition', ''))
                    
                    # Проверяем имя файла
                    filename = part.get_filename()
                    
                    if filename:
                        # Декодируем имя файла
                        decoded_filename = decode_header_value(filename)
                        
                        if decoded_filename and decoded_filename.lower().endswith('.pdf'):
                            has_pdf = True
                            pdf_size = len(part.get_payload(decode=True) or b'')
                            pdf_files.append(f"{decoded_filename} ({pdf_size} байт)")
                
                if has_pdf:
                    pdf_emails.append({
                        'id': email_id.decode(),
                        'subject': subject,
                        'sender': sender,
                        'date': date,
                        'pdfs': pdf_files
                    })
                    print(f"\n📄 Письмо #{idx} (ID: {email_id.decode()})")
                    print(f"   От: {sender}")
                    print(f"   Тема: {subject}")
                    print(f"   Дата: {date}")
                    print(f"   PDF файлы:")
                    for pdf in pdf_files:
                        print(f"      • {pdf}")
                
            except Exception as e:
                print(f"⚠️  Ошибка при обработке письма #{idx}: {e}")
        
        print(f"\n📊 Итого писем с PDF: {len(pdf_emails)}")
        
        if len(pdf_emails) == 0:
            print("\n⚠️  PDF файлы не найдены!")
            print("Проверьте:")
            print("1. Действительно ли в письмах есть вложения PDF")
            print("2. Не заблокированы ли вложения Gmail")
            print("3. Попробуйте отправить тестовое письмо с PDF на arno.help.service@gmail.com")
        
        imap.close()
        imap.logout()
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

def decode_header_value(header_value):
    """Декодирование заголовка письма."""
    if not header_value:
        return ''
    
    from email.header import decode_header
    
    decoded_parts = decode_header(header_value)
    decoded_string = ''
    
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            try:
                decoded_string += part.decode(encoding or 'utf-8')
            except:
                decoded_string += part.decode('utf-8', errors='ignore')
        else:
            decoded_string += str(part)
    
    return decoded_string

if __name__ == '__main__':
    test_gmail_connection()