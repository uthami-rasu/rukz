export function reducer(state, action) {
  switch (action.type) {
    case "SET_STATE":   return action.state;
    case "ADD_GOAL":    return { ...state, goals:    [...state.goals,    action.goal]    };
    case "ADD_SUBGOAL": return { ...state, subGoals: [...state.subGoals, action.subGoal] };
    case "ADD_TASK":    return { ...state, tasks:    [...state.tasks,    action.task]    };
    case "DELETE_TASK": return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) };
    case "EDIT_TASK":   return { ...state, tasks: state.tasks.map(t => t.id !== action.id ? t : { ...t, ...action.updates }) };
    case "TOGGLE_TASK": return {
      ...state,
      tasks: state.tasks.map(t =>
        t.id !== action.id ? t : {
          ...t,
          status: t.status === "completed" ? "pending" : "completed",
          completedDate: t.status === "completed" ? null : new Date().toISOString().slice(0, 10),
        }
      ),
    };
    case "DELETE_GOAL":
      return {
        ...state,
        goals:    state.goals.filter(g => g.id !== action.id),
        subGoals: state.subGoals.filter(s => s.goalId !== action.id),
        tasks:    state.tasks.filter(t => !state.subGoals.some(s => s.goalId === action.id && s.id === t.subGoalId)),
      };
    case "DELETE_SUBGOAL":
      return {
        ...state,
        subGoals: state.subGoals.filter(s => s.id !== action.id),
        tasks:    state.tasks.filter(t => t.subGoalId !== action.id),
      };
    default: return state;
  }
}
