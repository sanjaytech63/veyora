"use client";

import * as React from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useUIStore } from "@/stores/ui-store";
import { SERVICES } from "@veyora/config";
import { Sparkles, ShoppingBag, HelpCircle, Info } from "lucide-react";

const demoFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  notifications: z.boolean().default(false),
});

type DemoFormValues = z.infer<typeof demoFormSchema>;

export default function StorefrontHomePage() {
  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const form = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      notifications: true,
    },
  });

  const onSubmit = (data: DemoFormValues) => {
    toast.success("Validation successful!", {
      description: `Input validated via Zod schema for ${data.fullName} (${data.email})`,
    });
  };

  return (
    <div className="py-8 md:py-16 space-y-16">
      {/* Hero Section */}
      <section>
        <Container size="xl" className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Phase B — Frontend Design System & UI Foundation
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground max-w-4xl mx-auto">
            Modular Frontend Infrastructure for{" "}
            <span className="text-primary">{SERVICES.NAME}</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Design tokens, responsive layouts, Radix UI primitives, TanStack Query, Zustand client
            state, and Zod-validated forms with zero hardcoded colors.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={() =>
                toast.success("Toast Notification Triggered", {
                  description: "Sonner toast configured across all providers.",
                })
              }
            >
              Trigger Toast Notification
            </Button>
            <Button variant="outline" size="lg" onClick={() => setCartDrawerOpen(true)}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Toggle Zustand Cart Drawer
            </Button>
          </div>
        </Container>
      </section>

      {/* Design System & Components Showcase */}
      <section id="design-system">
        <Container size="xl" className="space-y-8">
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Design System Components</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive showcase of all 20+ required design system primitives.
            </p>
          </div>

          <Tabs defaultValue="actions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="actions">Actions & Inputs</TabsTrigger>
              <TabsTrigger value="feedback">Overlays & Popups</TabsTrigger>
              <TabsTrigger value="forms">Zod Forms</TabsTrigger>
              <TabsTrigger value="states">App States</TabsTrigger>
              <TabsTrigger value="surfaces">Cards & Badges</TabsTrigger>
            </TabsList>

            {/* Tab 1: Actions & Inputs */}
            <TabsContent value="actions" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Button Variants & Sizes</CardTitle>
                    <CardDescription>
                      Buttons with full CVA states, hover transitions, and focus rings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="default">Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="link">Link</Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                      <Button disabled>Disabled</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Selection & Toggle Controls</CardTitle>
                    <CardDescription>
                      Radix primitives for Checkbox, Radio, Switch, and Select.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Dark Mode Switch</label>
                        <p className="text-xs text-muted-foreground">Radix switch component</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox id="demo-check" defaultChecked />
                      <label htmlFor="demo-check" className="text-sm font-medium">
                        Accept terms & conditions
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Dropdown</label>
                      <Select defaultValue="standard">
                        <SelectTrigger>
                          <SelectValue placeholder="Choose option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard Priority</SelectItem>
                          <SelectItem value="express">Express Priority</SelectItem>
                          <SelectItem value="enterprise">Enterprise SLA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <RadioGroup defaultValue="card" className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="r1" />
                        <label htmlFor="r1" className="text-sm">
                          Card
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="crypto" id="r2" />
                        <label htmlFor="r2" className="text-sm">
                          Crypto
                        </label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 2: Overlays & Popups */}
            <TabsContent value="feedback" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dialog, Drawer, Tooltip & Popover</CardTitle>
                  <CardDescription>Accessible modals, slide-overs, and popovers.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  {/* Dialog */}
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Open Modal Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Foundation Modal</DialogTitle>
                        <DialogDescription>
                          Accessible modal overlay with focus trapping, ESC key listener, and
                          keyboard navigation.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 text-sm text-muted-foreground">
                        Phase B dialog skeleton ready for composition.
                      </div>
                      <Button onClick={() => setDialogOpen(false)}>Close Dialog</Button>
                    </DialogContent>
                  </Dialog>

                  {/* Drawer */}
                  <Drawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="secondary">Open Slide-up Drawer</Button>
                    </DrawerTrigger>
                    <DrawerContent className="p-6">
                      <DrawerHeader>
                        <DrawerTitle>Interactive Drawer (Vaul)</DrawerTitle>
                        <DrawerDescription>
                          Mobile-friendly bottom drawer component with swipe-to-dismiss.
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Controlled via Zustand UI store (`cartDrawerOpen: {String(cartDrawerOpen)}
                        `).
                      </div>
                      <Button onClick={() => setCartDrawerOpen(false)}>Close Drawer</Button>
                    </DrawerContent>
                  </Drawer>

                  {/* Tooltip */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tooltip primitive with delay duration configuration</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Info className="h-4 w-4" />
                        Info Popover
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <h4 className="font-semibold text-sm mb-1">Architecture Info</h4>
                      <p className="text-xs text-muted-foreground">
                        Popovers provide rich contextual menus and interactive flyouts outside
                        document flow.
                      </p>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Zod Forms */}
            <TabsContent value="forms" className="space-y-6">
              <Card className="max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle>React Hook Form + Zod</CardTitle>
                  <CardDescription>
                    Strict type-safe form validation with error messages and accessible ARIA
                    attributes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" {...field} />
                            </FormControl>
                            <FormDescription>
                              Your display name across the platform.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="jane@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Notification Preferences</FormLabel>
                              <FormDescription>Receive platform status updates.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full">
                        Validate and Submit Form
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: App States */}
            <TabsContent value="states" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Skeleton Loading</CardTitle>
                    <CardDescription>Animated shimmer pulse effect</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>

                <EmptyState
                  title="Empty Catalog State"
                  description="Pre-configured reusable empty state widget with icon and action slot."
                  action={<Button size="sm">Explore Collections</Button>}
                />

                <ErrorState
                  title="Network Boundary Error"
                  message="Component error boundary or query rejection fallback."
                  onRetry={() => toast.info("Retrying query...")}
                />
              </div>
              <LoadingState message="Demonstrating LoadingState spinner component" />
            </TabsContent>

            {/* Tab 5: Surfaces, Badges & Tokens */}
            <TabsContent value="surfaces" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Badge Status Variants</CardTitle>
                    <CardDescription>Semantic badge tokens using theme variables</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Badge variant="default">Default Primary</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="success">Active / Success</Badge>
                    <Badge variant="warning">Pending Review</Badge>
                    <Badge variant="destructive">Failed / Error</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Design Token Verification</CardTitle>
                    <CardDescription>CSS variable tokens mapped in Tailwind v4</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-background border text-foreground">
                      bg-background
                    </div>
                    <div className="p-2 rounded bg-card border text-card-foreground">bg-card</div>
                    <div className="p-2 rounded bg-primary text-primary-foreground">bg-primary</div>
                    <div className="p-2 rounded bg-secondary text-secondary-foreground">
                      bg-secondary
                    </div>
                    <div className="p-2 rounded bg-muted text-muted-foreground">bg-muted</div>
                    <div className="p-2 rounded bg-destructive text-destructive-foreground">
                      bg-destructive
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Container>
      </section>
    </div>
  );
}
