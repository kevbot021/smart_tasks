# **Product Requirements Document (PRD)**

---

## **1. Project Overview**

### **Purpose and Objectives**

**Purpose:**

- Develop a basic prototype of a To-Do List App as a Minimum Viable Product (MVP) to learn and demonstrate key concepts:
  - User authentication.
  - Backend development using Next.js 14.
  - Frontend development using Next.js 14 with Shadcn UI components and V0.
  - Styling using Tailwind CSS.
  - AI integration for task management.
  - Utilizing Cursor.com and OpenAI’s code generation models to assist in coding.

**Objectives:**

- Implement user sign-up and login functionalities.
- Create a system where users can create and manage tasks with sub-tasks.
- Enable task assignment to team members.
- Integrate OpenAI API to generate sub-tasks automatically.
- Implement email notifications for task assignments.
- Provide basic team management features (inviting/removing members, editing team name).

### **Background**

- This project is a proof of concept for internal learning purposes.
- It is not intended for public release or use by external users.
- Focus is on understanding core concepts rather than building a production-ready application.
- As a no-coder, you will leverage Cursor.com and OpenAI’s code generation capabilities to assist in developing the application.

### **Scope**

**Included:**

- User authentication and team management.
- Task creation, assignment, and completion features.
- AI integration for sub-task generation.
- Email notifications for task assignments.
- Basic user interface with two core pages: To-Do List and Settings.
- Use of Next.js 14 for both frontend and backend development.
- Styling with Tailwind CSS.
- UI components using Shadcn and V0.

**Excluded:**

- Advanced security measures.
- Scalability considerations.
- Mobile responsiveness (web-only focus).
- Extensive error handling for edge cases.

---

## **2. User Personas**

### **Admin User**

**Role:**

- The user who initially signs up becomes the Admin of a team.
- Has full access to all functionalities.

**Responsibilities:**

- Create and assign tasks to team members.
- Manage team settings (team name, members).
- Invite new team members via email.
- Remove team members from the team.

### **Team Member**

**Role:**

- A user invited by the Admin to join the team.
- Limited access, focused on assigned tasks. They cannot add their own tasks. They only see tasks that have been assigned to them.

**Responsibilities:**

- View and complete tasks assigned to them.
- Receive email notifications upon task assignment.
- Mark sub-tasks as complete.

---

## **3. Use Cases and User Stories**

### **Use Case 1: Admin Sign-Up and Team Creation**

**User Story:**

_As a new user, I want to sign up and automatically become the Admin of a new team so that I can manage tasks and team members._

**Steps:**

1. Navigate to the sign-up page.
2. Enter email and password.
3. Submit the form. A popup with a team name prompt appears.
4. Enter team name.
5. System creates a new user account with Admin privileges and a new team.
6. Redirected to the To-Do List page as the Admin.

### **Use Case 2: Admin Creates a Task**

**User Story:**

_As an Admin, I want to create a task and assign it to a team member to delegate work effectively._

**Steps:**

1. Click the “+” button on the To-Do List page.
2. “Create Task” modal appears.
3. Enter task description.
4. Select assignee from the “Assign To” dropdown.
5. Toggle “Use AI to create Subtasks” ON or OFF.
6. Click “Create”.
7. System saves the task and, if AI is ON, generates sub-tasks via OpenAI API.
8. Sends email notification to the assigned team member.
9. Task appears on the Admin’s To-Do List.

### **Use Case 3: Team Member Receives Task and Completes Sub-Tasks**

**User Story:**

_As a team member, I want to receive an email when a task is assigned to me and complete sub-tasks to contribute to the team’s work._

**Steps:**

1. Receive email notification with task details.
2. Click the link to access the app.
3. Log in to the account.
4. View the assigned task under “To Do”.
5. Expand task to view sub-tasks.
6. Mark each sub-task as complete.
7. Once all sub-tasks are complete, the primary task is marked complete and moves to “Complete”.

### **Use Case 4: Admin Manages Team Members**

**User Story:**

_As an Admin, I want to invite new team members and manage existing ones for effective collaboration._

**Steps:**

1. Click the cog icon to access Settings.
2. In “Team Members”, click “+” to invite new members.
3. Enter the new member’s name and email.
4. Click “Invite”.
5. System sends an invitation email; member appears as “Pending”.
6. To remove a member, click the delete icon next to their name and confirm.

### **Use Case 5: Admin Updates Team Name**

**User Story:**

_As an Admin, I want to change the team name to reflect the team’s identity._

**Steps:**

1. In Settings, edit the “Team Name” field.
2. Click “Save”.
3. System updates the team name and confirms the change.

---

## **4. Core Functionalities**

### **Authentication and User Roles**

**Sign-Up:**

- Users sign up with email and password.
- New users become Admins of their own teams.

**Login:**

- Users log in with their credentials.
- Passwords are securely hashed.

**Roles:**

- **Admin**: Full access to all features.
- **Team Member**: Access to assigned tasks only.

### **Task Management**

**Creating Tasks:**

- Access via “+” button.
- Modal fields:
  - Task Description
  - Assign To dropdown
  - “Use AI to create Subtasks” toggle
- Process:
  - Save task details to database.
  - If AI is ON, generate sub-tasks via OpenAI API.
  - Send email notification to assignee.
  - Task appears on the Admin’s To-Do List.

**Viewing and Completing Tasks:**

- Tasks displayed under “To Do” and “Complete” tabs.
- Expand tasks to view sub-tasks.
- Mark sub-tasks as complete using checkboxes.
- Task auto-completes when all sub-tasks are done.

**Deleting Tasks:**

- Admin can delete tasks using the delete icon.
- Confirmation required before deletion.

### **Team Management**

**Inviting Members:**

- Access via “+” in “Team Members” section.
- Enter name and email.
- System sends invitation email; member status is “Pending”.

**Removing Members:**

- Admin deletes member via delete icon.
- System revokes access upon confirmation.

### **Settings Management**

**Updating Team Name:**

- Edit team name in Settings.
- Click “Save” to update.

### **AI Integration for Sub-Task Generation**

**Process:**

- When toggled ON, task description sent to OpenAI API.
- Receives and saves three sub-tasks.
- Displays sub-tasks under the primary task.

**Error Handling:**

- If API fails, display error.
- Options to retry or proceed without AI.

### **Email Notifications**

**Task Assignment:**

- Email sent upon task assignment.
- Includes task details and link to app.

**Invitations:**

- Email sent when inviting new members.
- Contains sign-up link.

**Email Service:**

- Use Resend for email services.

---

## **5. Design and UX/UI Requirements**

### **Visual Design**

**Color Scheme:**

- Neutral colors: whites, grays, blues.
- Contrasting colors for action elements.

**Typography:**

- Clean, sans-serif fonts (e.g., Inter, Roboto).

**Icons:**

- Use standard icons for add, settings, delete, etc.

**UI Components:**

- Use Shadcn UI components and V0.
- Style with Tailwind CSS.

### **User Experience**

**Navigation:**

- Intuitive and consistent layout.
- Easy access to main features.

**Feedback:**

- Loading indicators for actions.
- Success and error messages.

**Accessibility:**

- High contrast for readability.
- Keyboard navigation support.
- Alt text for images/icons.

### **Responsive Design**

**Web Focused:**

- Optimized for desktop browsers.
- Elements adapt within desktop screen sizes.

---

## **6. Technical Requirements**

### **Frontend**

**Framework:**

- Next.js 14 for server-side rendering and routing using the app router.

**UI Components:**

- Use Shadcn and V0 libraries.

**Styling:**

- Implemented with Tailwind CSS.

**Features:**

- Responsive components.
- State management using React hooks (e.g., `useState`, `useEffect`).
- Integration with backend APIs.

### **Backend**

**Platform:**

- Backend using Next.js API routes.

**Database:**

- Use Supabase database (PostgreSQL).

**Data Models:**

- **Users:**
  - `id`, `name`, `email`, `role`, `team_id`, `created_at`
- **Teams:**
  - `id`, `name`, `admin_user_id`, `created_at`
- **Tasks:**
  - `id`, `description`, `assigned_user_id`, `created_by_user_id`, `team_id`, `is_complete`, `created_at`, `updated_at`
- **Sub-Tasks:**
  - `id`, `task_id`, `description`, `is_complete`, `created_at`, `updated_at`
- **Invitations:**
  - `id`, `team_id`, `email`, `status`, `created_at`, `updated_at`

### **Authentication**

- Use Supabase Auth for authentication.
- Passwords are securely hashed (e.g., using bcrypt).
- Session management with tokens.

### **Integrations**

**OpenAI API:**

- For generating sub-tasks.
- Requires API key and configuration.
- Assisted implementation using Cursor.com.

**Email Service:**

- Use Resend for sending emails.
- Requires setup and API keys.

### **Development Tools**

- **Cursor.com:**
  - Assists in code generation using OpenAI models.
- **Version Control:**
  - Use Git for version control.

### **Security**

- **Authentication:**
  - Password hashing.
  - Secure session management.
- **Data Protection:**
  - Role-based access control.
  - Secure data storage.

---

## **7. Documentation**

### **Example Code and Responses**

The following is an example of how authentication and user management can be handled using Supabase and OpenAI:

```typescript
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
    // Add user to the users table
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
    // Add user to the users table
    const { error: userError } = await supabase
      .from('users')
      .insert({ 
        id: authData.user.id, 
        name: name, 
        email: email, 
        role: 'member',
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
    .update({ assigned_user_id: userId })
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

  return isAdmin ? tasksWithSubtasks : tasksWithSubtasks.filter(task => task.assigned_user_id === userId);
};

const fetchSubtasks = async (taskId: string) => {
  const { data, error } = await supabase
    .from('sub_tasks')
    .select('*')
    .eq('task_id', taskId);

  if (error) throw error;

  return data;
};

// Example of marking a sub-task as complete
const handleToggleSubtaskComplete = async (subtaskId: string, currentStatus: boolean) => {
  const { error } = await supabase
    .from('sub_tasks')
    .update({ is_complete: !currentStatus })
    .eq('id', subtaskId);

  if (error) throw error;

  // Check if all subtasks are complete
  const { data: subtask, error: subtaskError } = await supabase
    .from('sub_tasks')
    .select('*')
    .eq('id', subtaskId)
    .single();

  if (subtaskError) throw subtaskError;

  const { data: remainingSubtasks, error: remainingSubtasksError } = await supabase
    .from('sub_tasks')
    .select('*')
    .eq('task_id', subtask.task_id)
    .eq('is_complete', false);

  if (remainingSubtasksError) throw remainingSubtasksError;

  if (remainingSubtasks.length === 0) {
    // All subtasks are complete, mark the main task as complete
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ is_complete: true })
      .eq('id', subtask.task_id);

    if (taskError) throw taskError;
  }
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
  fetchTasks,
  handleToggleSubtaskComplete,
  generateSubtasks
};
```

---

## **8. Project File Structure**

```
.
├── app
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login
│   │   └── page.tsx
│   ├── signup
│   │   └── page.tsx
│   ├── todo
│   │   └── page.tsx
│   ├── settings
│   │   └── page.tsx
├── components
│   ├── auth-form.tsx
│   ├── create-task-modal.tsx
│   ├── header.tsx
│   ├── task-item.tsx
│   ├── subtask-item.tsx
│   ├── task-list.tsx
│   ├── team-member-item.tsx
│   ├── settings-form.tsx
├── lib
│   ├── supabaseClient.ts
│   ├── openaiClient.ts
│   ├── emailService.ts
│   └── utils.ts
├── styles
│   └── globals.css
├── public
│   └── favicon.ico
├── next.config.js
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### **Explanation**

- **app/**: Contains all page components, following Next.js 14 app router convention.
  - **layout.tsx**: Root layout component wrapping all pages (server component).
  - **page.tsx**: Default landing page, possibly redirecting based on authentication.
  - **login/page.tsx**: Login page.
  - **signup/page.tsx**: Sign-up page.
  - **todo/page.tsx**: Main To-Do List page.
  - **settings/page.tsx**: Settings page.

- **components/**: Contains all reusable UI components, placed at the root level.
  - **auth-form.tsx**: Handles login and sign-up forms (client component).
  - **create-task-modal.tsx**: Modal for creating new tasks (client component).
  - **header.tsx**: Navigation header.
  - **task-item.tsx**: Displays a single task (client component).
  - **subtask-item.tsx**: Displays a single sub-task (client component).
  - **task-list.tsx**: Lists tasks and handles state (client component).
  - **team-member-item.tsx**: Displays a team member in the settings page.
  - **settings-form.tsx**: Form for updating team name and managing team members (client component).

- **lib/**: Contains utility libraries and clients.
  - **supabaseClient.ts**: Initializes the Supabase client.
  - **openaiClient.ts**: Initializes the OpenAI client.
  - **emailService.ts**: Handles email functionalities using Resend.
  - **utils.ts**: General utility functions.

- **styles/**: Contains global CSS and other styles.
  - **globals.css**: Tailwind CSS configurations and global styles.

- **public/**: Contains static assets like images and icons.
  - **favicon.ico**: Website favicon.

- **Configuration Files**:
  - **next.config.js**: Next.js configuration.
  - **package.json**: Project dependencies.
  - **tsconfig.json**: TypeScript configuration.
  - **tailwind.config.js**: Tailwind CSS configuration.

---

## **9. Additional Requirements**

### **Non-Functional Requirements**

- **Maintainability**:
  - Clean, modular code.
  - Well-documented for future reference.
- **Reliability**:
  - Consistent performance during testing.

### **Assumptions**

- The developer will act as all users for testing.
- Heavy reliance on Cursor.com and OpenAI for code assistance.
- Extensive testing is not required beyond core functionality.

### **Lean Approach**

- **Minimize Files**: Only create components when necessary. If a piece of UI is only used once and isn't complex, consider including it directly in the page.
- **Reusable Components**: Create components that can be reused across different pages to reduce redundancy.
- **Avoid Over-Engineering**: Stick to the core functionalities required for the MVP.

---

## **10. Supabase Database Structure**

### **Database Name**: `todo_app`

### **Tables**

1. **users**
   - `id`: `uuid` (primary key, auto-generated)
   - `email`: `text` (unique)
   - `name`: `text`
   - `role`: `text` (enum: `'admin'`, `'member'`)
   - `team_id`: `uuid` (foreign key referencing `teams.id`)
   - `created_at`: `timestamp with time zone` (default: `now()`)

2. **teams**
   - `id`: `uuid` (primary key, auto-generated)
   - `name`: `text`
   - `admin_user_id`: `uuid` (foreign key referencing `users.id`)
   - `created_at`: `timestamp with time zone` (default: `now()`)

3. **tasks**
   - `id`: `uuid` (primary key, auto-generated)
   - `description`: `text`
   - `assigned_user_id`: `uuid` (foreign key referencing `users.id`)
   - `created_by_user_id`: `uuid` (foreign key referencing `users.id`)
   - `team_id`: `uuid` (foreign key referencing `teams.id`)
   - `is_complete`: `boolean` (default: `false`)
   - `created_at`: `timestamp with time zone` (default: `now()`)
   - `updated_at`: `timestamp with time zone` (default: `now()`)

4. **sub_tasks**
   - `id`: `uuid` (primary key, auto-generated)
   - `task_id`: `uuid` (foreign key referencing `tasks.id`)
   - `description`: `text`
   - `is_complete`: `boolean` (default: `false`)
   - `created_at`: `timestamp with time zone` (default: `now()`)
   - `updated_at`: `timestamp with time zone` (default: `now()`)

5. **invitations**
   - `id`: `uuid` (primary key, auto-generated)
   - `team_id`: `uuid` (foreign key referencing `teams.id`)
   - `email`: `text`
   - `status`: `text` (enum: `'pending'`, `'accepted'`, `'rejected'`)
   - `created_at`: `timestamp with time zone` (default: `now()`)
   - `updated_at`: `timestamp with time zone` (default: `now()`)

---

## **11. Environment Variables**

Manage sensitive information using environment variables:

- **NEXT_PUBLIC_SUPABASE_URL**
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **OPENAI_API_KEY**
- **RESEND_API_KEY**

---

## **12. Dependencies**

Include the following dependencies in `package.json`:

- **next**: `"^14.0.0"`
- **react**: `"^18.0.0"`
- **react-dom**: `"^18.0.0"`
- **@supabase/supabase-js**: For database and authentication.
- **openai**: For AI integration.
- **resend**: For sending emails.
- **tailwindcss**: For styling.
- **@shadcn/ui** and **@shadcn/v0**: For UI components.

---

## **13. Example Workflow**

### **1. User Authentication**

- **Signup (`app/signup/page.tsx`)**: Uses `auth-form.tsx` component.
- **Login (`app/login/page.tsx`)**: Also uses `auth-form.tsx` component.

### **2. To-Do List Page (`app/todo/page.tsx`)**

- Fetch tasks from Supabase in the server component.
- Render `<TaskList tasks={tasks} />`.

### **3. TaskList Component (`components/task-list.tsx`)**

- Client component that handles state for expanding/collapsing tasks.
- Renders a list of `<TaskItem />` components.

### **4. TaskItem Component (`components/task-item.tsx`)**

- Displays task details.
- Renders a list of `<SubtaskItem />` components.

### **5. Settings Page (`app/settings/page.tsx`)**

- Fetch team data in the server component.
- Render `<SettingsForm team={team} />`.

### **6. SettingsForm Component (`components/settings-form.tsx`)**

- Client component that allows updating team name and managing team members.
- Uses `<TeamMemberItem />` for each team member.

---

## **14. Additional Notes**

### **Data Fetching and Component Interaction**

- **Server Components (Default in `app/`)**: Handle data fetching using Supabase and OpenAI API.

  **Example in `app/todo/page.tsx`:**

  ```tsx
  // app/todo/page.tsx
  import { fetchTasks } from '../../lib/supabaseClient';

  export default async function ToDoPage() {
    const tasks = await fetchTasks();

    return (
      <div>
        {/* Pass data down to client component */}
        <TaskList tasks={tasks} />
      </div>
    );
  }
  ```

- **Client Components (In `components/` with `"use client"`)**: Handle state and user interactions.

  **Example in `components/task-list.tsx`:**

  ```tsx
  // components/task-list.tsx
  "use client";
  import { useState } from 'react';
  import TaskItem from './task-item';

  export default function TaskList({ tasks }) {
    const [expandedTaskId, setExpandedTaskId] = useState(null);

    // Component logic...
  }
  ```

### **Routing**

- Use Next.js 14 app router for page navigation.
- Pages are defined under `app/` directory.

### **State Management**

- Utilize React's `useState` and `useEffect` hooks in client components.
- Pass down necessary data from server components to client components via props.

### **Styling**

- Use Tailwind CSS classes in your components.
- Keep styling consistent and adhere to design guidelines.

### **Environment Variables Security**

- Ensure API keys and sensitive information are stored securely.
- Do not expose keys in client-side code.

---

## **15. Final Thoughts**

By structuring the project files and documentation in this manner, we ensure:

- **Clear Alignment**: Developers have a comprehensive understanding of the project requirements and structure.
- **Adherence to Conventions**: Utilizing Next.js 14 conventions, including the app router and server components.
- **Separation of Concerns**: Keeping components, pages, and utilities organized.
- **Lean Architecture**: Creating the minimal number of files necessary for functionality.
- **Maintainability**: An organized file structure that is easy to navigate and update.

This PRD provides a solid foundation for the MVP while allowing for scalability and additional features in the future.

---

# **Conclusion**

This PRD encompasses all the necessary details for developers to implement the project effectively. It integrates the file structure, additional requirements, and documentation, including example code and responses, providing clear alignment and context for the development team.