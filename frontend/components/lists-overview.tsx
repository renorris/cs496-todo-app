"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Trash } from 'lucide-react';
import { PieChart } from './pie-chart';
import { useAuth } from '@/contexts/authcontext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ListSummary {
  uuid: string;
  title: string;
  earliest_due_date: string;
  created_at: string;
  tasks_completed: number;
  total_tasks: number;
}

const ListsOverview = () => {
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const accessToken = await auth.getAccessToken();
      const res = await fetch('https://todoapp.reesenorr.is/api/list/', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      setLists(data.map((list: ListSummary) => ({
        ...list,
        completed_tasks: Number(list.tasks_completed),
        total_tasks: Number(list.total_tasks),
      })));
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) {
      alert('Please provide both title and description');
      return;
    }
    setIsCreating(true);
    try {
      const accessToken = await auth.getAccessToken();
      const res = await fetch('https://todoapp.reesenorr.is/api/list/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });
      if (res.ok) {
        fetchLists();
        setShowAddForm(false);
        setNewTitle('');
        setNewDescription('');
      } else {
        const errorData = await res.json();
        if (errorData.detail) {
          alert(`Validation Error: ${errorData.detail.map((d: any) => d.msg).join(', ')}`);
        } else {
          alert('An error occurred while creating the list');
        }
      }
    } catch (error) {
      console.error('Error creating list:', error);
      alert('An error occurred while creating the list');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (listUuid: string) => {
    if (!confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      return;
    }
    try {
      const accessToken = await auth.getAccessToken();
      const res = await fetch(`https://todoapp.reesenorr.is/api/list/${listUuid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        fetchLists();
      } else {
        const errorData = await res.json();
        alert(`Error deleting list: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('An error occurred while deleting the list');
    }
  };

  if (lists === null) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your Lists</h1>
        <Button onClick={() => setShowAddForm(true)}>Add List</Button>
      </div>
      {showAddForm && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Add New List</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateList}>
              <div className="mb-4">
                <label htmlFor="newTitle" className="block text-sm font-medium mb-1">
                  Title
                </label>
                <Input
                  id="newTitle"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newDescription" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  id="newDescription"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description"
                  required
                />
              </div>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create List'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.length === 0 && <h2 className="text-2xl mb-4">No lists found</h2>}
        {lists.length > 0 && lists.map((list) => {
          const completed = Number(list.tasks_completed);
          const total = Number(list.total_tasks);
          const percentage = !isNaN(completed) && !isNaN(total) && total > 0
            ? Math.round((completed / total) * 100)
            : 0;

          return (
            <Link key={list.uuid} href={`/dashboard/list/${list.uuid}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{list.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={new Date(list.earliest_due_date) < new Date() ? 'destructive' : 'outline'}>
                        {new Date(list.earliest_due_date) < new Date() ? 'Overdue' : 'Active'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteList(list.uuid);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    <div className="flex items-center mt-2">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      <span className="text-xs">Created: {formatDate(list.created_at)}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-xs">Due: {formatDate(list.earliest_due_date)}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-24">
                      <PieChart completed={list.tasks_completed} total={list.total_tasks} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Progress</p>
                      <p className="text-2xl font-bold">{percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {list.tasks_completed} of {list.total_tasks} tasks
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default ListsOverview;
