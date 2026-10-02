from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from .models import Task
from .serializers import TaskSerializer, UserSerializer
import logging

logger = logging.getLogger('todo')

# 1. USER ACCOUNT REGISTRATION + EMAIL TRIGGER
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()  # Saves account to database

        # Capture registration details dynamically
        user_email = user.email
        user_name = user.username

        # Trigger the Outbound Welcome Email Function safely
        try:
            subject = "📝 Account Registered Successfully - DeskPlanner Studio"
            message = (
                f"Hello {user_name},\n\n"
                f"Your digital ledger sheet profile has been officially created in permanent ink!\n"
                f"You can now securely log in from your dashboard browser to manage your tasks, dates, and priority layouts.\n\n"
                f"Best regards,\n"
                f"The DeskPlanner Studio Engineering Team"
            )

            send_mail(
                subject,
                message,
                None,                  # Automatically uses DEFAULT_FROM_EMAIL from settings.py
                [user_email],          # Target user email destination
                fail_silently=False,   # Tells Django to raise an exception if mail fails
            )
            logger.info(f"Welcome email sent to {user_email}")
        except Exception as email_error:
            # Logs error to logs/django.log AND to terminal
            logger.error(f"SMTP ERROR — Failed to send welcome email to {user_email}: {email_error}")

        return Response({"message": "User registered inside cloud ledger and welcome email forwarded!"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 2. USER SESSION SECURE LOGIN
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username_input = request.data.get('username')
    password = request.data.get('password')
    
    # 🌟 Checks if they typed an email, and maps it to their real username string
    if username_input and '@' in username_input:
        try:
            user_profile = User.objects.get(email=username_input)
            username_input = user_profile.username 
        except User.DoesNotExist:
            pass 
            
    user = authenticate(username=username_input, password=password)
    
    if user is not None:
        # Success: Return the clean username to update the React banner
        return Response({
            "message": "Login successful!",
            "username": user.username
        }, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Invalid username or password match!"}, status=status.HTTP_400_BAD_REQUEST)


# 3. GLOBAL LOG OUT GATEWAY
@api_view(['POST'])
def logout_user(request):
    logout(request)  # Flushes out active session storage markers
    return Response({"message": "Logged out safely!"}, status=status.HTTP_200_OK)

# 4. TASK MANAGER (GET ALL OWNER ENTRIES / SUBMIT NEW ENTRY)
@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def manage_tasks(request, task_id=None):

    
    username = request.headers.get('X-User-Profile') or request.data.get('username')
    
    if not username:
        return Response({"error": "User identity mapping is missing."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if '@' in username:
            user = User.objects.get(email=username)
        else:
            user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User profile not found in ledger."}, status=status.HTTP_404_NOT_FOUND)

    # 1. Handle dynamic PATCH updates for checkboxes instantly
    if request.method == 'PATCH' and task_id:
        try:
            task = Task.objects.get(id=task_id, user = user)
            task.completed = request.data.get('completed', task.completed)
            task.save()
            serializer = TaskSerializer(task)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Task.DoesNotExist:
            return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

                # Handle single task deletion (Red Cross click)
    elif request.method == 'DELETE' and task_id:
        try:
            task = Task.objects.get(id=task_id, user=user)
            task.delete() # 🌟 This permanently wipes the row from your db.sqlite3 file
            return Response({"message": "Task permanently erased from server ledger."}, status=status.HTTP_200_OK)
        except Task.DoesNotExist:
            return Response({"error": "Task not found in ledger database."}, status=status.HTTP_404_NOT_FOUND)


    # 2. Extract identity headers for standard GET and POST requests

    # 3. Read Task History Workflow
    if request.method == 'GET':
        tasks = Task.objects.filter(user=user)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 4. Create New Task Workflow
    elif request.method == 'POST':
        text = request.data.get('text')
        date = request.data.get('date')
        time = request.data.get('time')
        priority = request.data.get('priority', 'low')

        if not text:
            return Response({"error": "Task details cannot be blank."}, status=status.HTTP_400_BAD_REQUEST)

        task = Task.objects.create(
            user=user, text=text, date=date, time=time, priority=priority
        )
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)



# 5. INDIVIDUAL ITEM ACTIONS (TOGGLE COMPLETE CHECKBOX / STRIP ROW)
@api_view(['PATCH', 'DELETE'])
def task_detail(request, pk):
    if not request.user.is_authenticated:
        return Response({"error": "Session expired!"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        task = Task.objects.get(pk=pk, user=request.user)
    except Task.DoesNotExist:
        return Response({"error": "Task record not found!"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        task.delete()
        return Response({"message": "Task deleted successfully!"}, status=status.HTTP_204_NO_CONTENT)
@api_view(['DELETE'])
@permission_classes([AllowAny]) # We handle security manually below by passing the user identity
def delete_account(request):
    username = request.data.get('username')
    
    if not username:
        return Response({"error": "Username is required to delete an account."}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        # Find the user inside your Django database
        user = User.objects.get(username=username)
        user.delete() # Completely wipes the user from the database
        return Response({"message": "Account permanently deleted from ledger."}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "Account not found in ledger."}, status=status.HTTP_404_NOT_FOUND)


