from django.core.management.base import BaseCommand
from rentapp.models import ComplaintReason


class Command(BaseCommand):
    help = 'Инициализирует дефолтные причины жалоб для арендаторов и арендодателей'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Принудительно пересоздать все причины (удалить существующие)',
        )

    def handle(self, *args, **options):
        if options['force']:
            self.stdout.write('Удаляем существующие причины...')
            ComplaintReason.objects.all().delete()

        # Причины для жалоб на арендодателей (от арендаторов)
        landlord_reasons = [
            "Отсутствие ремонта помещения",
            "Повышение арендной платы без уведомления", 
            "Нарушение условий договора",
            "Игнорирование заявок на устранение неисправностей",
            "Отказ от предоставления документов на жилье"
        ]
        
        # Причины для жалоб на арендаторов (от арендодателей)
        tenant_reasons = [
            "Просрочка платежей",
            "Порча имущества",
            "Нарушение условий договора",
            "Жалобы от соседей / нарушение порядка",
            "Самовольное выселение или отказ освободить помещение"
        ]

        created_count = 0
        updated_count = 0

        # Создаем причины для арендодателей
        self.stdout.write('Создаем причины для жалоб на арендодателей...')
        for reason_text in landlord_reasons:
            reason, created = ComplaintReason.objects.get_or_create(
                reason=reason_text,
                defaults={'type': 'landlord'}
            )
            if created:
                created_count += 1
                self.stdout.write(f'  ✓ Создана: {reason_text}')
            else:
                updated_count += 1
                self.stdout.write(f'  → Обновлена: {reason_text}')
        
        # Создаем причины для арендаторов
        self.stdout.write('Создаем причины для жалоб на арендаторов...')
        for reason_text in tenant_reasons:
            reason, created = ComplaintReason.objects.get_or_create(
                reason=reason_text,
                defaults={'type': 'tenant'}
            )
            if created:
                created_count += 1
                self.stdout.write(f'  ✓ Создана: {reason_text}')
            else:
                updated_count += 1
                self.stdout.write(f'  → Обновлена: {reason_text}')

        self.stdout.write(
            self.style.SUCCESS(
                f'\nИнициализация завершена!\n'
                f'Создано новых причин: {created_count}\n'
                f'Обновлено существующих: {updated_count}\n'
                f'Всего причин в системе: {ComplaintReason.objects.count()}'
            )
        )
