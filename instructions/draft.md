**#Project Overview**

Purpose and Objectives:

	•	Purpose: Develop a basic prototype of a To-Do List App as a Minimum Viable Product (MVP) to learn and demonstrate key concepts:
	•	User authentication.
	•	Backend development using Next.js 14.
	•	Frontend development using Next.js 14 with shadcn UI components and V0.
	•	Styling using Tailwind CSS.
	•	AI integration for task management.
	•	Utilizing Cursor.com and OpenAI’s code generation models to assist in coding.
	•	Objectives:
	•	Implement user sign-up and login functionalities.
	•	Create a system where users can create and manage tasks with sub-tasks.
	•	Enable task assignment to team members.
	•	Integrate OpenAI API to generate sub-tasks automatically.
	•	Implement email notifications for task assignments.
	•	Provide basic team management features (inviting/removing members, editing team name).

Background:

	•	This project is a proof of concept for internal learning purposes.
	•	It is not intended for public release or use by external users.
	•	Focus is on understanding core concepts rather than building a production-ready application.
	•	As a no-coder, you will leverage Cursor.com and OpenAI’s code generation capabilities to assist in developing the application.

Scope:

	•	Included:
	•	User authentication and team management.
	•	Task creation, assignment, and completion features.
	•	AI integration for sub-task generation.
	•	Email notifications for task assignments.
	•	Basic user interface with two core pages: To-Do List and Settings.
	•	Use of Next.js 14 for both frontend and backend development.
	•	Styling with Tailwind CSS.
	•	UI components using shadcn and V0.
	•	Excluded:
	•	Advanced security measures.
	•	Scalability considerations.
	•	Mobile responsiveness (web-only focus).
	•	Extensive error handling for edge cases.

User Personas

Admin User:

	•	Role:
	•	The user who initially signs up becomes the Admin of a team.
	•	Has full access to all functionalities.
	•	Responsibilities:
	•	Create and assign tasks to team members.
	•	Manage team settings (team name, members).
	•	Invite new team members via email.
	•	Remove team members from the team.

Team Member:

	•	Role:
	•	A user invited by the Admin to join the team.
	•	Limited access, focused on assigned tasks. They cannot add their own tasks. They only see tasks that have been assigned to them.
	•	Responsibilities:
	•	View and complete tasks assigned to them.
	•	Receive email notifications upon task assignment.
	•	Mark sub-tasks as complete.

Use Cases and User Stories

Use Case 1: Admin Sign-Up and Team Creation

	•	User Story:
As a new user, I want to sign up and automatically become the Admin of a new team so that I can manage tasks and team members.
	•	Steps:
	1.	Navigate to the sign-up page.
	2.	Enter email and password.
	3.	Submit the form. Popup with team name prompt appears.
	4.	Enter team name.
	5.	System creates a new user account with Admin privileges and a new team.
	6.	Redirected to the To-Do List page as the Admin.

Use Case 2: Admin Creates a Task

	•	User Story:
As an Admin, I want to create a task and assign it to a team member to delegate work effectively.
	•	Steps:
	1.	Click the “+” button on the To-Do List page.
	2.	“Create Task” modal appears.
	3.	Enter task description.
	4.	Select assignee from the “Assign To” dropdown.
	5.	Toggle “Use AI to create Subtasks” ON or OFF.
	6.	Click “Create”.
	7.	System saves the task and, if AI is ON, generates sub-tasks via OpenAI API.
	8.	Sends email notification to the assigned team member.
	9.	Task appears on the Admin’s To-Do List.

Use Case 3: Team Member Receives Task and Completes Sub-Tasks

	•	User Story:
As a team member, I want to receive an email when a task is assigned to me and complete sub-tasks to contribute to the team’s work.
	•	Steps:
	1.	Receive email notification with task details.
	2.	Click the link to access the app.
	3.	Log in to the account.
	4.	View the assigned task under “To Do”.
	5.	Expand task to view sub-tasks.
	6.	Mark each sub-task as complete.
	7.	Once all sub-tasks are complete, the primary task is marked complete and moves to “Complete”.

Use Case 4: Admin Manages Team Members

	•	User Story:
As an Admin, I want to invite new team members and manage existing ones for effective collaboration.
	•	Steps:
	1.	Click the cog icon to access Settings.
	2.	In “Team Members”, click “+” to invite new members.
	3.	Enter the new member’s name and email.
	4.	Click “Invite”.
	5.	System sends an invitation email; member appears as “Pending”.
	6.	To remove a member, click the delete icon next to their name and confirm.

Use Case 5: Admin Updates Team Name

	•	User Story:
As an Admin, I want to change the team name to reflect the team’s identity.
	•	Steps:
	1.	In Settings, edit the “Team Name” field.
	2.	Click “Save”.
	3.	System updates the team name and confirms the change.

**#Core Functionalities**

Authentication and User Roles

	•	Sign-Up:
	•	Users sign up with email and password.
	•	New users become Admins of their own teams.
	•	Login:
	•	Users log in with their credentials.
	•	Passwords are securely hashed.
	•	Roles:
	•	Admin: Full access to all features.
	•	Team Member: Access to assigned tasks only.

Task Management

	•	Creating Tasks:
	•	Access via “+” button.
	•	Modal fields:
	•	Task Description
	•	Assign To dropdown
	•	“Use AI to create Subtasks” toggle
	•	Process:
	•	Save task details to database.
	•	If AI is ON, generate sub-tasks via OpenAI API.
	•	Send email notification to assignee.
	•	Viewing and Completing Tasks:
	•	Tasks displayed under “To Do” and “Complete” tabs.
	•	Expand tasks to view sub-tasks.
	•	Mark sub-tasks as complete using checkboxes.
	•	Task auto-completes when all sub-tasks are done.
	•	Deleting Tasks:
	•	Admin can delete tasks using the delete icon.
	•	Confirmation required before deletion.

Team Management

	•	Inviting Members:
	•	Access via “+” in “Team Members” section.
	•	Enter name and email.
	•	System sends invitation email; member status is “Pending”.
	•	Removing Members:
	•	Admin deletes member via delete icon.
	•	System revokes access upon confirmation.

Settings Management

	•	Updating Team Name:
	•	Edit team name in Settings.
	•	Click “Save” to update.

AI Integration for Sub-Task Generation

	•	Process:
	•	When toggled ON, task description sent to OpenAI API.
	•	Receives and saves three sub-tasks.
	•	Displays sub-tasks under the primary task.
	•	Error Handling:
	•	If API fails, display error.
	•	Options to retry or proceed without AI.

Email Notifications

	•	Task Assignment:
	•	Email sent upon task assignment.
	•	Includes task details and link to app.
	•	Invitations:
	•	Email sent when inviting new members.
	•	Contains sign-up link.
    Use Resend for email service

5. Design and UX/UI Requirements

Visual Design

	•	Color Scheme:
	•	Neutral colors: whites, grays, blues.
	•	Contrasting colors for action elements.
	•	Typography:
	•	Clean, sans-serif fonts (e.g., Inter, Roboto).
	•	Icons:
	•	Use standard icons for add, settings, delete, etc.
	•	UI Components:
	•	Use shadcn UI components and V0.
	•	Style with Tailwind CSS.

User Experience

	•	Navigation:
	•	Intuitive and consistent layout.
	•	Easy access to main features.
	•	Feedback:
	•	Loading indicators for actions.
	•	Success and error messages.
	•	Accessibility:
	•	High contrast for readability.
	•	Keyboard navigation support.
	•	Alt text for images/icons.

Responsive Design

	•	Web Focused:
	•	Optimized for desktop browsers.
	•	Elements adapt within desktop screen sizes.

Technical Requirements

Frontend

	•	Framework:
	•	Next.js 14 for server-side rendering and routing.
	•	UI Components:
	•	Use shadcn and V0 libraries.
	•	Styling:
	•	Implemented with Tailwind CSS.
	•	Features:
	•	Responsive components.
	•	State management (e.g., React Context, Redux).
	•	Integration with backend APIs.

Backend

	•	Platform:
	•	Backend using Next.js API routes.
	•	Database:
	•	Use a supabase database (e.g., MongoDB, PostgreSQL).
	•	Data Models:
	•	Users:
	•	UserID, Name, Email, PasswordHash, Role, TeamID
	•	Teams:
	•	TeamID, TeamName, AdminUserID
	•	Tasks:
	•	TaskID, Description, AssignedUserID, CreatedByUserID, TeamID, IsComplete, DateCreated
	•	Sub-Tasks:
	•	SubTaskID, TaskID, Description, IsComplete

Authentication

	•	Use Clerk or Supabase Auth for authentication.


Integrations

	•	OpenAI API:
	•	For generating sub-tasks.
	•	Requires API key and configuration.
	•	Assisted implementation using Cursor.com.
	•	Email Service:
	•	Options: Resend
	•	For sending emails.
	•	Requires setup and API keys.

Development Tools

	•	Cursor.com:
	•	Assists in code generation using OpenAI models.
	•	Version Control:
	•	Use Git for version control.

Security

	•	Authentication:
	•	Password hashing (e.g., bcrypt).
	•	Session management with tokens (e.g., JWT, NextAuth.js).
	•	Data Protection:
	•	Role-based access control.
	•	Secure data storage.



**#Documentation**
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===================== Authentication =====================

// Example of creating an account
const handleSignUp = async (email: string, password: string, name: string, teamId: string) => {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { name: name },
    },
  });

  if (signUpError) throw signUpError;

  if (authData.user) {
    // Add user to the public.users table
    const { error: userError } = await supabase
      .from('users')
      .insert({ 
        id: authData.user.id, 
        name: name, 
        email: email, 
        role: 'admin',
        team_id: teamId
      });

    if (userError) throw userError;
  }
};

// Example of creating a team
const createTeam = async (teamName: string, userId: string) => {
  const { data, error } = await supabase
    .from('teams')
    .insert({ name: teamName, admin_user_id: userId })
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Example of logging in
const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) throw error;

  return data;
};

// ===================== Admin Actions =====================

// Example of adding a team member
const handleInvite = async (email: string, name: string, teamId: string) => {
  // Create a new user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: email,
    password: 'temporaryPassword', // Should be changed on first login
    options: {
      data: { name: name },
    },
  });

  if (signUpError) throw signUpError;

  if (authData.user) {
    // Add user to the public.users table
    const { error: userError } = await supabase
      .from('users')
      .insert({ 
        id: authData.user.id, 
        name: name, 
        email: email, 
        role: 'user',
        team_id: teamId
      });

    if (userError) throw userError;
  }
};

// Example of creating a task with OpenAI-generated subtasks
const handleCreateTask = async (description: string, teamId: string) => {
  // Generate subtasks using OpenAI
  const subtasks = await generateSubtasks(description);

  // Create the main task
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .insert({ description: description, team_id: teamId })
    .select()
    .single();

  if (taskError) throw taskError;

  // Create subtasks
  const { data: subtasksData, error: subtasksError } = await supabase
    .from('sub_tasks')
    .insert(subtasks.map(subtask => ({ ...subtask, task_id: taskData.id })))
    .select();

  if (subtasksError) throw subtasksError;

  return { ...taskData, subtasks: subtasksData };
};

// Example of assigning a task
const handleAssignTask = async (taskId: string, userId: string | null) => {
  const { error } = await supabase
    .from('tasks')
    .update({ assigned_to: userId })
    .eq('id', taskId);

  if (error) throw error;
};

// Example of editing a task
const handleEditTask = async (taskId: string, newDescription: string) => {
  const { error } = await supabase
    .from('tasks')
    .update({ description: newDescription })
    .eq('id', taskId);

  if (error) throw error;
};

// Example of deleting a task
const handleDeleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
};

// ===================== User Actions =====================

// Example of viewing tasks (for both admin and regular users)
const fetchTasks = async (userId: string, isAdmin: boolean, teamId: string) => {
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (tasksError) throw tasksError;

  const tasksWithSubtasks = await Promise.all(
    tasksData.map(async (task) => {
      const subtasks = await fetchSubtasks(task.id);
      return { ...task, subtasks };
    })
  );

  return isAdmin ? tasksWithSubtasks : tasksWithSubtasks.filter(task => task.assigned_to === userId);
};

const fetchSubtasks = async (taskId: string) => {
  const { data, error } = await supabase
    .from('sub_tasks')
    .select('*')
    .eq('task_id', taskId);

  if (error) throw error;

  return data;
};

// Example of marking a task as done
const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
  const { error } = await supabase
    .from('tasks')
    .update({ is_complete: !currentStatus })
    .eq('id', taskId);

  if (error) throw error;

  // Update all subtasks to match the primary task's status
  const { error: subtaskError } = await supabase
    .from('sub_tasks')
    .update({ is_complete: !currentStatus })
    .eq('task_id', taskId);

  if (subtaskError) throw subtaskError;
};

// ===================== Utilities =====================

// Example of OpenAI API call for generating subtasks
async function generateSubtasks(taskDescription: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant that generates subtasks for a given task." },
      { role: "user", content: `Generate 3 subtasks for the following task: "${taskDescription}"` }
    ],
    max_tokens: 150,
    n: 1,
    temperature: 0.7,
  });

  const subtasks = completion.choices[0].message.content
    ?.split('\n')
    .filter(Boolean)
    .map(subtask => subtask.replace(/^\d+\.\s*/, '').trim())
    .slice(0, 3);

  return subtasks.map(description => ({ description, is_complete: false }));
}

export {
  handleSignUp,
  createTeam,
  handleLogin,
  handleInvite,
  handleCreateTask,
  handleAssignTask,
  handleEditTask,
  handleDeleteTask,
  fetchTasks,
  handleToggleComplete,
  generateSubtasks
};






**#Current File Structure**
.
├── README.md
├── app
│   ├── favicon.ico
│   ├── fonts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── ui
├── components.json
├── instructions
│   └── draft.md
├── lib
│   └── utils.ts
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json


**#Additional Requirements**
Non-Functional Requirements

	•	Maintainability:
	•	Clean, modular code.
	•	Well-documented for future reference.
	•	Reliability:
	•	Consistent performance during testing.

Assumptions

	•	You will act as all users for testing.
	•	Heavy reliance on Cursor.com and OpenAI for code assistance.
	•	Extensive testing is not required beyond core functionality.

**#Supabase Database Structure**

Database Name: todo_app

Tables:

1. users
   - id: uuid (primary key, auto-generated)
   - email: text (unique)
   - name: text
   - role: text (enum: 'admin', 'member')
   - team_id: uuid (foreign key referencing teams.id)
   - created_at: timestamp with time zone (default: now())

2. teams
   - id: uuid (primary key, auto-generated)
   - name: text
   - admin_user_id: uuid (foreign key referencing users.id)
   - created_at: timestamp with time zone (default: now())

3. tasks
   - id: uuid (primary key, auto-generated)
   - description: text
   - assigned_user_id: uuid (foreign key referencing users.id)
   - created_by_user_id: uuid (foreign key referencing users.id)
   - team_id: uuid (foreign key referencing teams.id)
   - is_complete: boolean (default: false)
   - created_at: timestamp with time zone (default: now())
   - updated_at: timestamp with time zone (default: now())

4. sub_tasks
   - id: uuid (primary key, auto-generated)
   - task_id: uuid (foreign key referencing tasks.id)
   - description: text
   - is_complete: boolean (default: false)
   - created_at: timestamp with time zone (default: now())
   - updated_at: timestamp with time zone (default: now())

5. invitations
   - id: uuid (primary key, auto-generated)
   - team_id: uuid (foreign key referencing teams.id)
   - email: text
   - status: text (enum: 'pending', 'accepted', 'rejected')
   - created_at: timestamp with time zone (default: now())
   - updated_at: timestamp with time zone (default: now())
