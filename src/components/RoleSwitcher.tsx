import React, { useState } from "react";
import { Shield, ChevronDown, ChevronUp, UserCheck, Star } from "lucide-react";
import { User } from "../types";

interface RoleSwitcherProps {
  users: User[];
  currentUser: User | null;
  onSwitchUser: (userId: string) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  users,
  currentUser,
  onSwitchUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Group roles logically to display in the grid
  const roleGroups = [
    {
      title: "Academic Users",
      items: users.filter((u) => ["Student", "Instructor", "Academic Advisor"].includes(u.role)),
    },
    {
      title: "Administration & Approval",
      items: users.filter((u) => ["Department Head", "Approval Committee", "Registrar Head", "Registrar Staff"].includes(u.role)),
    },
    {
      title: "Special Operations",
      items: users.filter((u) => ["Discipline Officer", "Graduation Officer", "College Administration", "System Administrator"].includes(u.role)),
    },
  ];

  return (
    <div className="bg-white border-t border-slate-200 text-slate-700 text-xs shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-mono tracking-wider text-[10px] font-bold">
            DEMO PANEL
          </span>
          <span className="text-slate-500 font-medium">
            Multi-Role Evaluation Portal: Experience SIMS from all 11 institutional roles.
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500">Current Identity: </span>
              <strong className="text-slate-800 font-bold">{currentUser.name}</strong>
              <span className="text-slate-500 bg-slate-200/60 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                {currentUser.role}
              </span>
            </div>
          )}
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
          >
            <span>Switch Role ({users.length})</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-5 transition-all duration-300">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleGroups.map((group, gIdx) => (
              <div key={gIdx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2.5 border-b border-slate-100 pb-1.5 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-emerald-500" /> {group.title}
                </h4>
                <div className="space-y-1.5">
                  {group.items.map((user) => {
                    const isSelected = currentUser?.id === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between group cursor-pointer border ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                            : "bg-slate-50 hover:bg-slate-100/80 border-slate-150 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate text-xs flex items-center gap-1.5">
                            {user.name}
                            {user.faceEnrolled && (
                              <span
                                title="Facial Recognition Signature Registered"
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                              />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 group-hover:text-slate-500 truncate font-mono mt-0.5">
                            {user.role} ({user.id})
                          </div>
                        </div>
                        <UserCheck
                          className={`w-4 h-4 transition ${
                            isSelected
                              ? "text-emerald-600 opacity-100"
                              : "text-slate-300 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="max-w-7xl mx-auto mt-4 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3 font-medium">
            Tip: Complete a student course registration, switch to <strong>Academic Advisor</strong> to approve it, then switch to <strong>Instructor</strong> to enter grades, and advance them through department, committee, and registrar approvals!
          </div>
        </div>
      )}
    </div>
  );
};
