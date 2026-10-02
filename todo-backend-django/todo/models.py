from django.db import models
from django.contrib.auth.models import User

class Task(models.Model):
    # Links each task to a specific user profile row in the database
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    
    # Task specific information rows
    text = models.CharField(max_length=255)
    date = models.DateField()
    time = models.CharField(max_length=50, default="No deadline")
    
    # Priority configurations matching your watercolor filters
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='low')
    
    # Completed tracking switch
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.text}"
from django.db import models
from django.contrib.auth.models import User

class Task(models.Model):
    # Links each task to a specific user account in your database
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    text = models.CharField(max_length=255)
    date = models.DateField()
    time = models.CharField(max_length=50, default='No deadline')
    priority = models.CharField(max_length=10, default='low')
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text
