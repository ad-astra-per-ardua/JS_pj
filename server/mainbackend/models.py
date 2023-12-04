from django.db import models

class Restaurant(models.Model):
    name = models.CharField(max_length=100)  # 업소명
    phone_number = models.CharField(max_length=50)  # 전화번호
    address = models.CharField(max_length=255)  # 도로명주소
    cuisine_type = models.CharField(max_length=50)  # 업태
    latitude = models.FloatField(null=True, blank=True)  # 위도
    longitude = models.FloatField(null=True, blank=True)  # 경도

    def __str__(self):
        return self.name
