import React from 'react';
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Trash2 } from "lucide-react";

export function Welcome() {
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (newTask.trim() !== "") {
      setTasks([...tasks, newTask]);
      setNewTask("");
    }
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 gap-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Todo List</h1>
      <div className="flex gap-2 w-full space-y-2">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter a task"
          className="flex-1"
        />
        <Button onClick={addTask}>Add</Button>
      </div>
      <div className="w-full space-y-2">
        {tasks.map((task, index) => (
          <Card key={index}>
            <div className = "flex place-items-center">
              <Checkbox className="ml-2 -mr-2"/>
              <CardContent className="font-semibold">{task}</CardContent>
              <Button className="ml-auto relative -left-2" variant="ghost" onClick={() => removeTask(index)}>
                <Trash2 size={18} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}