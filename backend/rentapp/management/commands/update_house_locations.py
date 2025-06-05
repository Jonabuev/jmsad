from django.core.management.base import BaseCommand
from rentapp.models import House

class Command(BaseCommand):
    help = "Обновляет координаты и административную информацию домов"

    def handle(self, *args, **kwargs):
        for house in House.objects.all():
            lat, lon, region, city, district = house.get_coordinates()
            if lat and lon:
                house.latitude = lat
                house.longitude = lon
                house.region = region
                house.city = city
                house.district = district
                house.save()
                self.stdout.write(self.style.SUCCESS(f'Обновлено: {house.address}'))
            else:
                self.stdout.write(self.style.WARNING(f'Пропущено: {house.address}'))
