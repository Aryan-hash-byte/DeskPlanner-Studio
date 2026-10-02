from django.contrib import admin
from .models import Task

# Customizes how Tasks look inside the Django admin cockpit dashboard panel
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    # 🌟 THIS LINE SAYS: "Show the text description, owner account, and check status columns!"
    list_display = ('text', 'user', 'completed', 'date', 'time')
    
    # Allows you to click filters on the right sidebar panel
    list_filter = ('user', 'completed', 'priority')
