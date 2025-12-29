import { 
  CloudUpload, 
  Paperclip, 
  Users, 
  ArrowRight,
  CheckCircle2,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const features = [
  {
    icon: CloudUpload,
    title: "Data Sync and Backup",
    description: "Users' tasks and app settings are synchronized across multiple devices.",
    color: "primary",
  },
  {
    icon: Paperclip,
    title: "Task Attachments",
    description: "Users can attach files, documents, or links to tasks, providing additional context or reference material.",
    color: "coral",
  },
  {
    icon: Users,
    title: "Task Collaboration",
    description: "Users can collaborate with other users on tasks, allowing them to coordinate from anywhere in real-time.",
    color: "mint",
  },
];

const statsData = [
  { value: "29M+", label: "Installed over the time" },
  { value: "100M+", label: "Total tasks overall completed" },
];

export function Features() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-light/5 rounded-full blur-3xl" />

      <div className="container px-4 md:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - App Preview */}
          <div className="relative">
            {/* Main Card */}
            <div className="bg-card rounded-3xl shadow-purple-lg border border-border p-8 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center shadow-purple">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Create Task</p>
                    <p className="text-xs text-muted-foreground">App Design</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">12-16 March, 2025</span>
              </div>

              {/* Project Overview Card */}
              <div className="bg-gradient-purple rounded-2xl p-6 text-white mb-6">
                <h3 className="font-bold mb-2">Project Overview</h3>
                <p className="text-sm text-white/80 mb-4">
                  Design a modern and user-friendly website that enhances user experience and aligns with brand identity.
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-white/60">Total Working Hours</p>
                    <p className="text-xl font-bold">64:52:00</p>
                  </div>
                  <div className="flex -space-x-2 ml-auto">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + i - 1)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {[
                  { name: 'Create Single Style Guide Branding Name Website', checked: true },
                  { name: 'Create Single Style Guide Branding Name Website', checked: true },
                  { name: 'Create Single Style Guide Branding Name Website', checked: false },
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      task.checked ? "bg-mint border-mint" : "border-border"
                    )}>
                      {task.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn("text-sm", task.checked && "line-through text-muted-foreground")}>{task.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {statsData.map((stat, i) => (
                <div key={i} className="bg-card rounded-2xl p-5 shadow-card border border-border">
                  <p className="text-3xl font-black text-gradient">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Features List */}
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              Comprehensive{" "}
              <span className="text-gradient">Feature Set</span>
              <br />
              of a Task Manager App
            </h2>

            <div className="space-y-6 mt-10">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isHovered = hoveredIndex === index;
                
                return (
                  <div
                    key={feature.title}
                    className={cn(
                      "group p-6 rounded-2xl border border-border bg-card",
                      "transition-all duration-300 cursor-pointer",
                      "hover:shadow-card-hover hover:border-primary/20",
                      "animate-fade-in-up"
                    )}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div 
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                          "transition-all duration-300",
                          feature.color === 'primary' && "bg-primary/10 text-primary",
                          feature.color === 'coral' && "bg-coral/10 text-coral",
                          feature.color === 'mint' && "bg-mint/10 text-mint",
                          isHovered && "scale-110"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>

                      {/* Arrow */}
                      <div 
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          "bg-secondary transition-all duration-300",
                          isHovered && "bg-primary text-white"
                        )}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}