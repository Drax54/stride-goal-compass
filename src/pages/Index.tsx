
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Target, CalendarCheck, BarChart, MobileIcon } from 'lucide-react';

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-accent/10 to-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-accent px-3 py-1 text-sm text-white">
                  New Release
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Track Your Habits <br />
                  <span className="text-accent">Achieve Your Goals</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A modern, user-friendly habit tracking application to help you build consistency and reach your personal goals.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link to="/auth/register">
                  <Button className="bg-accent hover:bg-accent/90">Get Started</Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md overflow-hidden rounded-xl border bg-white shadow-xl">
                <div className="p-4">
                  <div className="flex items-center gap-2 pb-4">
                    <Target className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-accent">Habitify</span>
                    <div className="ml-auto rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">4 completed</div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Morning Meditation", streak: 5, color: "purple" },
                      { name: "Daily Exercise", streak: 3, color: "blue" },
                      { name: "Read a Book", streak: 7, color: "green" }
                    ].map((habit, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-full bg-habit-${habit.color}/20 flex items-center justify-center`}>
                            <div className={`h-3 w-3 rounded-full bg-habit-${habit.color}`}></div>
                          </div>
                          <span>{habit.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">{habit.streak} day streak</span>
                          <div className="rounded-full bg-green-100 p-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="animate-pulse rounded-lg border bg-card p-3 shadow-sm">
                      <div className="h-6 w-3/4 rounded-md bg-muted"></div>
                      <div className="mt-2 h-4 w-1/2 rounded-md bg-muted"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Key Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Build Better Habits</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Habitify combines powerful tracking features with simple design to help you stay on track.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
            {[
              {
                icon: <CalendarCheck className="h-10 w-10 text-accent" />,
                title: "Goal-based Habit Creation",
                description: "Create habits tied to specific goals to stay focused on what matters most to you."
              },
              {
                icon: <BarChart className="h-10 w-10 text-accent" />,
                title: "Detailed Analytics",
                description: "Visualize your progress with intuitive charts and statistics to keep you motivated."
              },
              {
                icon: <MobileIcon className="h-10 w-10 text-accent" />,
                title: "Mobile Friendly",
                description: "Track your habits on the go with our fully responsive mobile design."
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center space-y-4 rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full border p-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-center text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-accent text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Transform Your Habits?</h2>
              <p className="mx-auto max-w-[700px] md:text-xl">
                Join thousands of users who are building better habits and achieving their goals with Habitify.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link to="/auth/register">
                <Button className="bg-white text-accent hover:bg-white/90">Get Started for Free</Button>
              </Link>
              <Link to="/auth/login">
                <Button variant="outline" className="text-white border-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Testimonials
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Users Say</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Hear from people who have transformed their habits with Habitify.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3">
            {[
              {
                quote: "Habitify helped me establish a consistent meditation practice that I've maintained for over 6 months now.",
                author: "Sarah J.",
                role: "Marketing Manager"
              },
              {
                quote: "The analytics feature gives me the motivation I need to keep pushing forward with my fitness goals.",
                author: "Michael T.",
                role: "Software Engineer"
              },
              {
                quote: "I've tried many habit trackers, but Habitify's simple design makes it easy to stay consistent.",
                author: "Elena R.",
                role: "Freelance Writer"
              }
            ].map((testimonial, i) => (
              <div key={i} className="flex flex-col justify-between space-y-4 rounded-lg border bg-background p-6 shadow-sm">
                <p className="text-muted-foreground">"{testimonial.quote}"</p>
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
