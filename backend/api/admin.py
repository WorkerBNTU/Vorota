from django.contrib import admin

from .models import Advantage, HeroSlide, Lead, PortfolioItem, Service, SiteSettings, WorkStep

admin.site.register(SiteSettings)
admin.site.register(HeroSlide)
admin.site.register(Service)
admin.site.register(Advantage)
admin.site.register(WorkStep)
admin.site.register(PortfolioItem)
admin.site.register(Lead)
