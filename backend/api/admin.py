from django.contrib import admin

from .models import Advantage, HeroSlide, Lead, PortfolioItem, Service, SiteSettings, WorkStep


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'phone', 'message')
    # PII / consent не правятся в django-admin (как в CRM API)
    readonly_fields = (
        'name', 'phone', 'message', 'source',
        'city', 'interest', 'opening_width', 'opening_height', 'drive_type',
        'privacy_consent', 'privacy_consent_at',
        'created_at', 'updated_at',
    )


admin.site.register(SiteSettings)
admin.site.register(HeroSlide)
admin.site.register(Service)
admin.site.register(Advantage)
admin.site.register(WorkStep)
admin.site.register(PortfolioItem)
