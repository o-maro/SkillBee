import React, { useMemo } from 'react';
import TaskCard from './TaskCard';

const TaskerTasksPage = ({ tasks }) => {
  // Categorize tasks according to status and payment
  const { upcomingTasks, inProgressTasks, completedTasks } = useMemo(() => {
    const upcomingTasks = [];
    const inProgressTasks = [];
    const completedTasks = [];
    tasks.forEach(task => {
      // Defensive: handle missing/inconsistent status gracefully
      const status = task.status || '';
      const paymentConfirmed = task.paymentStatus === 'paid' || task.paymentConfirmed === true;
      if (
        (status === 'pending' || status === 'booked' || status === 'awaiting_acceptance') &&
        !paymentConfirmed
      ) {
        upcomingTasks.push(task);
      } else if (
        (status === 'accepted' || status === 'in_progress' || status === 'active') &&
        !paymentConfirmed
      ) {
        inProgressTasks.push(task);
      } else if (
        (status === 'completed' || status === 'done') && paymentConfirmed
      ) {
        completedTasks.push(task);
      }
      // Cancelled tasks: do not show unless system already does
    });
    return { upcomingTasks, inProgressTasks, completedTasks };
  }, [tasks]);

  return (
    <div className="tasker-tasks-page">
      <section>
        <h2>Upcoming Tasks</h2>
        {upcomingTasks.length === 0 ? (
          <div className="empty-state">No upcoming tasks.</div>
        ) : (
          <div className="task-list">
            {upcomingTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
      <section>
        <h2>In Progress</h2>
        {inProgressTasks.length === 0 ? (
          <div className="empty-state">No tasks in progress.</div>
        ) : (
          <div className="task-list">
            {inProgressTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
      <section>
        <h2>Completed Tasks</h2>
        {completedTasks.length === 0 ? (
          <div className="empty-state">No completed tasks.</div>
        ) : (
          <div className="task-list">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TaskerTasksPage;