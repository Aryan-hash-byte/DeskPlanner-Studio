from django.contrib import admin
from django.urls import path
from todo import views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # React Communication API Endpoint Gates
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),
    path('api/logout/', views.logout_user, name='logout'),
    # Add this line here:
    path('api/delete-account/', views.delete_account, name='delete_account'),

      # Update your existing api/tasks/ path to accept a task id number optionally:
        # 🛑 UPDATE BOTH TASK LINES IN urlpatterns TO LOOK EXACTLY LIKE THIS:
    path('api/tasks/', views.manage_tasks, name='manage_tasks'),
    path('api/tasks/<int:task_id>/', views.manage_tasks, name='manage_tasks_detail'), # 👈 Colon added here!


]

