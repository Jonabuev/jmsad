from rest_framework import generics, permissions
from rentapp.models import House, RentalComplaint
from rentapp.serializers import RentalComplaintSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response


class ForumView(generics.ListAPIView):
    serializer_class = RentalComplaintSerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to view the forum

    def get_queryset(self):
        filter_type = self.request.query_params.get('filter', 'popular')
        region = self.request.query_params.get('region')
        city = self.request.query_params.get('city')
        district = self.request.query_params.get('district')
        address = self.request.query_params.get('address')

        qs = RentalComplaint.objects.filter(status='reviewed')

        # Apply geographic filters
        if region:
            qs = qs.filter(rental__house__region__iexact=region)
        if city:
            qs = qs.filter(rental__house__city__iexact=city)
        if district:
            qs = qs.filter(rental__house__district__iexact=district)
        
        # Apply address search
        if address:
            qs = qs.filter(rental__house__address__icontains=address)

        # Apply sorting
        if filter_type == 'new':
            return qs.order_by('-created_at')
        elif filter_type == 'old':
            return qs.order_by('created_at')
        return qs.order_by('-support_count')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Allow anyone to get location filters
def get_location_filters(request):
    regions = House.objects.exclude(region__isnull=True).exclude(region__exact='').values_list('region', flat=True).distinct()
    cities = House.objects.exclude(city__isnull=True).exclude(city__exact='').values_list('city', flat=True).distinct()
    districts = House.objects.exclude(district__isnull=True).exclude(district__exact='').values_list('district', flat=True).distinct()

    return Response({
        "regions": sorted(regions),
        "cities": sorted(cities),
        "districts": sorted(districts),
    })





