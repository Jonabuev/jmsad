import traceback
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from rentapp.utils import EmailParser
from rentapp.models import EmailDocument
from rentapp.views.read_pdf import extract_text_from_pdf, extract_case_number, extract_main_accused, extract_birth_date


class Command(BaseCommand):
    help = 'Парсинг писем с PDF документами'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sender',
            type=str,
            default=None,
            help='Фильтр по отправителю (email)'
        )
        parser.add_argument(
            '--test',
            action='store_true',
            help='Тестовый режим (не сохраняет в БД)'
        )

    def handle(self, *args, **options):
        sender_filter = options.get('sender')
        test_mode = options.get('test', False)
        
        self.stdout.write("🔄 Начало парсинга email...")
        
        if test_mode:
            self.stdout.write("⚠️  ТЕСТОВЫЙ РЕЖИМ - данные не будут сохранены")
        
        parser = EmailParser()
        emails = parser.get_unprocessed_emails(sender_filter=sender_filter)
        
        self.stdout.write(f"📧 Найдено писем с PDF: {len(emails)}")
        
        if len(emails) == 0:
            self.stdout.write(self.style.WARNING("⚠️  Писем не найдено. Проверьте:"))
            self.stdout.write("   1. Есть ли письма в почте arno.help.service@gmail.com")
            self.stdout.write("   2. Включен ли IMAP в настройках Gmail")
            self.stdout.write("   3. Правильный ли пароль приложения в .env")
            self.stdout.write("   4. Есть ли PDF вложения в письмах")
            return
        
        for email_data in emails:
            if test_mode:
                self._test_email(email_data)
            else:
                self._process_email(email_data, parser)
        
        self.stdout.write(self.style.SUCCESS("✅ Парсинг завершен"))
    
    def _test_email(self, email_data: dict):
        """Тестовая обработка письма без сохранения."""
        self.stdout.write(f"\n📧 Тест письма:")
        self.stdout.write(f"   От: {email_data['sender']}")
        self.stdout.write(f"   Тема: {email_data['subject']}")
        self.stdout.write(f"   Дата: {email_data['date']}")
        self.stdout.write(f"   PDF файлов: {len(email_data['pdf_attachments'])}")
        
        for attachment in email_data['pdf_attachments']:
            self.stdout.write(f"   📄 {attachment['filename']} ({len(attachment['data'])} байт)")
    
    def _process_email(self, email_data: dict, parser: EmailParser):
        """Обработка одного письма."""
        email_id = email_data['email_id']
        
        total_attachments = len(email_data['pdf_attachments'])
        processed_count = 0
        
        self.stdout.write(f"\n📧 Обработка письма: {email_id}")
        self.stdout.write(f"   Вложений к обработке: {total_attachments}")
        
        for idx, attachment in enumerate(email_data['pdf_attachments'], 1):
            try:
                # Проверяем по email_id + filename
                if EmailDocument.objects.filter(
                    email_id=email_id,
                    filename=attachment['filename']
                ).exists():
                    self.stdout.write(f"⏭️  [{idx}/{total_attachments}] Документ {attachment['filename']} уже обработан")
                    processed_count += 1
                    continue
                
                self.stdout.write(f"📄 [{idx}/{total_attachments}] Обработка: {attachment['filename']}")
                
                # Сохраняем PDF файл
                pdf_content = ContentFile(attachment['data'])
                
                # Создаем запись в БД
                email_doc = EmailDocument.objects.create(
                    email_id=email_id,
                    sender=email_data['sender'],
                    subject=email_data['subject'],
                    received_date=email_data['date'],
                    filename=attachment['filename'],
                    status='pending'
                )
                
                # Сохраняем файл
                email_doc.pdf_file.save(
                    attachment['filename'],
                    pdf_content,
                    save=True
                )
                
                # Парсим PDF
                self._parse_pdf(email_doc)
                
                processed_count += 1
                self.stdout.write(self.style.SUCCESS(f"✅ [{idx}/{total_attachments}] Обработано: {attachment['filename']}"))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ [{idx}/{total_attachments}] Ошибка: {e}"))
                traceback.print_exc()
        
        # Помечаем письмо как прочитанное ТОЛЬКО если обработаны ВСЕ вложения
        if processed_count == total_attachments:
            parser.mark_as_read(email_id)
            self.stdout.write(f"✉️  Письмо {email_id} помечено как прочитанное ({processed_count}/{total_attachments})")
        else:
            self.stdout.write(self.style.WARNING(f"⚠️  Письмо {email_id} НЕ помечено (обработано {processed_count}/{total_attachments})"))    
    def _parse_pdf(self, email_doc: EmailDocument):
        """Парсинг PDF документа."""
        try:
            # Открываем PDF файл
            with email_doc.pdf_file.open('rb') as pdf_file:
                # Извлекаем текст
                text = extract_text_from_pdf(pdf_file)
                
                # Парсим данные
                case_numbers = [n.replace("№", "").strip() for n in extract_case_number(text)]
                main_accused = extract_main_accused(text)
                birth_date = extract_birth_date(text)
                
                # Сохраняем результаты
                email_doc.parsed_data = {
                    "case_numbers": case_numbers,
                    "main_accused": main_accused,
                    "birth_date": birth_date or "",
                    "is_court_case": True,
                }
                email_doc.status = 'parsed'
                email_doc.save()
                
        except Exception as e:
            email_doc.status = 'error'
            email_doc.error_message = str(e)
            email_doc.save()
            raise
    def _test_email(self, email_data: dict):
        """Тестовая обработка письма без сохранения."""
        self.stdout.write(f"\n📧 Тест письма:")
        self.stdout.write(f"   Email ID: {email_data['email_id']}")
        self.stdout.write(f"   От: {email_data['sender']}")
        self.stdout.write(f"   Тема: {email_data['subject']}")
        self.stdout.write(f"   Дата: {email_data['date']}")
        self.stdout.write(f"   PDF файлов: {len(email_data['pdf_attachments'])}")
        
        for idx, attachment in enumerate(email_data['pdf_attachments'], 1):
            self.stdout.write(f"   📄 [{idx}] {attachment['filename']} ({len(attachment['data'])} байт)")