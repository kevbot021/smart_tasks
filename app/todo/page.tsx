"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import TaskItem from '../../components/TaskItem'
import AddTask from '../../components/AddTask'
import InviteTeamMember from '../../components/InviteTeamMember'
import { Button } from "@/components/ui/button"
import { Settings } from 'lucide-react'
import type { Task, Subtask } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { getColorForCategory } from '@/lib/utils'
import TaskCard from '../../components/TaskCard'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface TeamMember {
  id: string
  name: string
}

export default function ToDoPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [userName, setUserName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All'])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserAndTeamInfo = async () => {
    console.group('👤 Fetching User & Team Info');
    console.time('User info fetch duration');
    
    try {
      console.log('🔍 Getting user session...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('❌ No user found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('✅ User found:', { userId: user.id });
      setUserId(user.id);

      console.log('🔍 Fetching user details...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, team_id, role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('❌ Error fetching user data:', userError);
        throw userError;
      }

      console.log('✅ User details:', userData);
      setUserName(userData.name);
      setTeamId(userData.team_id);
      setIsAdmin(userData.role === 'admin');

      console.log('🔍 Fetching team details...');
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('name')
        .eq('id', userData.team_id)
        .single();

      if (teamError) {
        console.error('❌ Error fetching team data:', teamError);
        throw teamError;
      }

      console.log('✅ Team details:', teamData);
      setTeamName(teamData.name);

    } catch (error) {
      console.error('❌ Error in fetchUserAndTeamInfo:', error);
    } finally {
      console.timeEnd('User info fetch duration');
      console.groupEnd();
    }
  }

  const fetchTasks = async (userId: string, isAdmin: boolean, teamId: string) => {
    const startTime = performance.now();
    console.group('📡 Fetching Tasks');
    console.log('Request params:', { userId, isAdmin, teamId });
    
    try {
      if (!teamId || !userId) {
        console.warn('❌ Missing required IDs', { teamId, userId });
        return;
      }

      setIsLoading(true);
      console.time('Task fetch duration');

      let query = supabase
        .from('tasks')
        .select(`
          *,
          sub_tasks (*)
        `)
        .eq('team_id', teamId);

      if (!isAdmin) {
        query = query.eq('assigned_user_id', userId);
      }

      console.log('🔍 Executing Supabase query...');
      const { data: taskData, error: taskError } = await query.order('created_at', { ascending: false });

      if (taskError) {
        console.error('❌ Error fetching tasks:', taskError);
        return;
      }

      const endTime = performance.now();
      console.log(`✅ Tasks fetched successfully in ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 Fetched ${taskData?.length || 0} tasks`);
      console.log('First task sample:', taskData?.[0]);

      setTasks(taskData || []);
      setFilteredTasks(taskData || []);
    } catch (error) {
      console.error('❌ Error in fetchTasks:', error);
    } finally {
      setIsLoading(false);
      console.timeEnd('Task fetch duration');
      console.groupEnd();
    }
  }

  const fetchTeamMembers = async () => {
    console.group('👥 Fetching Team Members');
    console.time('Team members fetch duration');
    
    try {
      if (!teamId) {
        console.warn('❌ No teamId available');
        return;
      }

      console.log('🔍 Fetching team members for team:', teamId);
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('team_id', teamId);

      if (error) {
        console.error('❌ Error fetching team members:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} team members`);
      setTeamMembers(data || []);
    } catch (error) {
      console.error('❌ Error in fetchTeamMembers:', error);
    } finally {
      console.timeEnd('Team members fetch duration');
      console.groupEnd();
    }
  }

  const filterTasks = () => {
    if (selectedCategories.includes('All')) {
      setFilteredTasks(tasks)
    } else {
      setFilteredTasks(tasks.filter(task => 
        selectedCategories.includes(task.category) || 
        (selectedCategories.includes('Completed') && task.is_complete)
      ))
    }
  }

  useEffect(() => {
    fetchUserAndTeamInfo()
  }, [])

  useEffect(() => {
    if (userId && teamId && isAdmin !== undefined) {
      console.log('Triggering task fetch with:', { userId, teamId, isAdmin })
      fetchTasks(userId, isAdmin, teamId)
    }
  }, [userId, teamId, isAdmin])

  useEffect(() => {
    if (tasks.length > 0) {
      filterTasks()
    }
  }, [tasks, selectedCategories])

  useEffect(() => {
    if (teamId) {
      fetchTeamMembers()
    }
  }, [teamId])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (category === 'All') {
        return ['All']
      }
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev.filter(c => c !== 'All'), category]
      return newCategories.length === 0 ? ['All'] : newCategories
    })
  }

  const handleAddTask = (newTask: Task) => {
    setTasks(currentTasks => {
      const taskIndex = currentTasks.findIndex(task => task.id === newTask.id);
      
      if (taskIndex === -1) {
        // Task doesn't exist, add it to the beginning
        return [newTask, ...currentTasks];
      } else {
        // Task exists, update it
        const updatedTasks = [...currentTasks];
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          ...newTask
        };
        return updatedTasks;
      }
    });
  };

  const handleToggleComplete = async (taskId: string, isComplete: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_complete: isComplete })
      .eq('id', taskId)

    if (error) throw error

    await fetchTasks(userId, isAdmin, teamId)
  }

  const handleToggleSubtaskComplete = async (subtaskId: string, isComplete: boolean) => {
    const { error } = await supabase
      .from('sub_tasks')
      .update({ is_complete: isComplete })
      .eq('id', subtaskId)

    if (error) throw error

    await fetchTasks(userId, isAdmin, teamId)
  }

  const handleAssignTask = async (taskId: string, assignedUserId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_user_id: assignedUserId === 'unassigned' ? null : assignedUserId })
        .eq('id', taskId)

      if (error) {
        console.error('Error assigning task:', error)
        throw error
      }

      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, assigned_user_id: assignedUserId === 'unassigned' ? null : assignedUserId }
          : task
      ))

      setFilteredTasks(prevFilteredTasks => prevFilteredTasks.map(task => 
        task.id === taskId 
          ? { ...task, assigned_user_id: assignedUserId === 'unassigned' ? null : assignedUserId }
          : task
      ))

      console.log(`Task ${taskId} assigned to user ${assignedUserId}`)
    } catch (error) {
      console.error('Error in handleAssignTask:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleUpdateTask = async (taskId: string, newDescription: string) => {
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ description: newDescription })
        .eq('id', taskId)

      if (updateError) throw updateError

      const response = await fetch('/api/generate-subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskDescription: newDescription }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate subtasks')
      }

      const { subtasks } = await response.json()

      const { error: deleteError } = await supabase
        .from('sub_tasks')
        .delete()
        .eq('task_id', taskId)

      if (deleteError) throw deleteError

      const { error: insertError } = await supabase
        .from('sub_tasks')
        .insert(subtasks.map((subtaskDescription: string) => ({
          task_id: taskId,
          description: subtaskDescription,
          is_complete: false
        })))

      if (insertError) throw insertError

      await fetchTasks(userId, isAdmin, teamId)
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      console.log(`Attempting to delete task with ID: ${taskId}`);

      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (taskError) {
        console.error('Error deleting task:', taskError);
        throw taskError;
      }

      console.log(`Task ${taskId} deleted from database successfully`);

      const { error: subtasksError } = await supabase
        .from('sub_tasks')
        .delete()
        .eq('task_id', taskId);

      if (subtasksError) {
        console.error('Error deleting subtasks:', subtasksError);
      }

      setTasks(prevTasks => {
        const newTasks = prevTasks.filter(task => task.id !== taskId);
        console.log(`Tasks after deletion:`, newTasks);
        return newTasks;
      });
      setFilteredTasks(prevFilteredTasks => prevFilteredTasks.filter(task => task.id !== taskId));

      console.log(`Task ${taskId} removed from local state`);

      await fetchTasks(userId, isAdmin, teamId);

    } catch (error) {
      console.error('Error in handleDeleteTask:', error);
    }
  };

  const categories = ['All', 'Completed', ...Array.from(new Set(tasks.map(task => task.category || 'Uncategorized').filter(Boolean)))]

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-6">Smart Tasks</h2>
        <nav>
          <ul className="space-y-2">
            {categories.map((category) => {
              const categoryColor = getColorForCategory(category)
              return (
                <li key={category} className="flex items-center">
                  <Checkbox
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                    className={`mr-2 ${categoryColor.border} ${categoryColor.bg}`}
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className={`flex-grow cursor-pointer ${categoryColor.text}`}
                  >
                    {category}
                  </label>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Good Morning, {userName}! 👋
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={() => setShowInviteModal(true)}>
                  View Team
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : isAdmin ? (
          <>
            <AddTask 
              onAddTask={handleAddTask}
              userId={userId}
              teamId={teamId}
            />
            <div className="space-y-6 mt-8">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  teamMembers={teamMembers}
                  isAdmin={isAdmin}
                  onToggleComplete={handleToggleComplete}
                  onToggleSubtaskComplete={handleToggleSubtaskComplete}
                  onAssignTask={handleAssignTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignerName={teamMembers.find(m => m.id === task.created_by_user_id)?.name}
              />
            ))}
          </div>
        )}
        {showInviteModal && (
          <InviteTeamMember
            teamId={teamId}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </main>
    </div>
  )
}
