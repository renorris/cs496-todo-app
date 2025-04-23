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
import { CalendarDays, Clock } from 'lucide-react';
import { PieChart } from './pie-chart';
import { useAuth } from '@/contexts/authcontext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ListSummary {
  uuid: string;
  title: string;
  due_date: string;
  created_at: string;
  completedTasks: number;
  totalTasks: number;
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
      setLists(data);
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
        const data = await res.json();
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
        {lists.length > 0 && lists.map((list) => (
          <Link key={list.uuid} href={`/dashboard/list/${list.uuid}`}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{list.title}</CardTitle>
                  <Badge variant={new Date(list.due_date) < new Date() ? 'destructive' : 'outline'}>
                    {new Date(list.due_date) < new Date() ? 'Overdue' : 'Active'}
                  </Badge>
                </div>
                <CardDescription>
                  <div className="flex items-center mt-2">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    <span className="text-xs">Created: {formatDate(list.created_at)}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-xs">Due: {formatDate(list.due_date)}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="w-24 h-24">
                    <PieChart completed={list.completedTasks} total={list.totalTasks} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Progress</p>
                    <p className="text-2xl font-bold">{Math.round((list.completedTasks / list.totalTasks) * 100)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {list.completedTasks} of {list.totalTasks} tasks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
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