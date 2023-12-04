# Generated by Django 4.2.6 on 2023-12-04 10:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mainbackend', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Restaurant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('phone_number', models.CharField(max_length=50)),
                ('address', models.CharField(max_length=255)),
                ('cuisine_type', models.CharField(max_length=50)),
                ('latitude', models.FloatField(blank=True, null=True)),
                ('longitude', models.FloatField(blank=True, null=True)),
            ],
        ),
        migrations.DeleteModel(
            name='mainbackend',
        ),
    ]