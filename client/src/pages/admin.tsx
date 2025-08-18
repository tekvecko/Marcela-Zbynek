import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Camera, Trophy, Settings, Plus, Edit, Trash2, CheckCircle, XCircle, Heart, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import type { QuestChallenge, UploadedPhoto, User, QuestProgress } from "@shared/schema";

// Form schemas
const challengeSchema = z.object({
  title: z.string().min(1, "Název je povinný"),
  description: z.string().min(1, "Popis je povinný"),
  targetPhotos: z.number().min(1, "Minimálně 1 fotka"),
  points: z.number().min(1, "Minimálně 1 bod"),
  isActive: z.boolean(),
});

type ChallengeFormData = z.infer<typeof challengeSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingChallenge, setEditingChallenge] = useState<QuestChallenge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch data
  const { data: challenges = [], isLoading: challengesLoading } = useQuery<QuestChallenge[]>({
    queryKey: ["/api/quest-challenges"],
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery<UploadedPhoto[]>({
    queryKey: ["/api/photos"],
  });

  const { data: progress = [], isLoading: progressLoading } = useQuery<QuestProgress[]>({
    queryKey: ["/api/quest-progress"],
  });

  // Form setup
  const form = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      description: "",
      targetPhotos: 1,
      points: 10,
      isActive: true,
    },
  });

  // Mutations
  const createChallengeMutation = useMutation({
    mutationFn: (data: ChallengeFormData) =>
      apiRequest("/api/admin/challenges", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quest-challenges"] });
      toast({ title: "Úspěch", description: "Výzva byla vytvořena" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateChallengeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChallengeFormData }) =>
      apiRequest(`/api/admin/challenges/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quest-challenges"] });
      toast({ title: "Úspěch", description: "Výzva byla aktualizována" });
      setIsDialogOpen(false);
      setEditingChallenge(null);
      form.reset();
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/challenges/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quest-challenges"] });
      toast({ title: "Úspěch", description: "Výzva byla smazána" });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/photos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({ title: "Úspěch", description: "Fotka byla smazána" });
    },
  });

  const togglePhotoVerificationMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      apiRequest(`/api/admin/photos/${id}/verify`, { method: "POST", body: { isVerified } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({ title: "Úspěch", description: "Stav ověření byl změněn" });
    },
  });

  // Handle form submission
  const onSubmit = (data: ChallengeFormData) => {
    if (editingChallenge) {
      updateChallengeMutation.mutate({ id: editingChallenge.id, data });
    } else {
      createChallengeMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (challenge: QuestChallenge) => {
    setEditingChallenge(challenge);
    form.setValue("title", challenge.title);
    form.setValue("description", challenge.description);
    form.setValue("targetPhotos", challenge.targetPhotos);
    form.setValue("points", challenge.points);
    form.setValue("isActive", challenge.isActive);
    setIsDialogOpen(true);
  };

  // Handle new challenge
  const handleNew = () => {
    setEditingChallenge(null);
    form.reset();
    setIsDialogOpen(true);
  };

  // Statistics
  const stats = {
    totalChallenges: challenges.length,
    activeChallenges: challenges.filter(c => c.isActive).length,
    totalPhotos: photos.length,
    verifiedPhotos: photos.filter(p => p.isVerified).length,
    totalLikes: photos.reduce((sum, p) => sum + p.likes, 0),
    uniqueUploaders: new Set(photos.map(p => p.uploaderName)).size,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Administrace
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Správa výzev, fotek a uživatelů svatební platformy
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-stat-challenges">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Výzvy</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-challenges-count">
                {stats.activeChallenges}/{stats.totalChallenges}
              </div>
              <p className="text-xs text-muted-foreground">aktivní/celkem</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-photos">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fotky</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-photos-count">
                {stats.verifiedPhotos}/{stats.totalPhotos}
              </div>
              <p className="text-xs text-muted-foreground">ověřené/celkem</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-likes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Srdíčka</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-likes-count">
                {stats.totalLikes}
              </div>
              <p className="text-xs text-muted-foreground">celkem</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uživatelé</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-users-count">
                {stats.uniqueUploaders}
              </div>
              <p className="text-xs text-muted-foreground">aktivní</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges" data-testid="tab-challenges">
              <Trophy className="h-4 w-4 mr-2" />
              Výzvy
            </TabsTrigger>
            <TabsTrigger value="photos" data-testid="tab-photos">
              <Camera className="h-4 w-4 mr-2" />
              Fotky
            </TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">
              <Users className="h-4 w-4 mr-2" />
              Pokrok
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Správa výzev</CardTitle>
                  <CardDescription>
                    Vytvářejte a upravujte fotografické výzvy pro hosty
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNew} data-testid="button-create-challenge">
                      <Plus className="h-4 w-4 mr-2" />
                      Nová výzva
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingChallenge ? "Upravit výzvu" : "Nová výzva"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingChallenge ? "Upravte existující výzvu" : "Vytvořte novou fotografickou výzvu"}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Název</FormLabel>
                              <FormControl>
                                <Input placeholder="Název výzvy" {...field} data-testid="input-challenge-title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Popis</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Popis výzvy" {...field} data-testid="input-challenge-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="targetPhotos"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Počet fotek</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-challenge-photos"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="points"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Body</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-challenge-points"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Aktivní</FormLabel>
                                <FormDescription>
                                  Výzva je viditelná pro uživatele
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-challenge-active"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createChallengeMutation.isPending || updateChallengeMutation.isPending}
                            data-testid="button-save-challenge"
                          >
                            {editingChallenge ? "Uložit" : "Vytvořit"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {challengesLoading ? (
                  <div className="text-center py-8">Načítání výzev...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Název</TableHead>
                        <TableHead>Popis</TableHead>
                        <TableHead>Fotky/Body</TableHead>
                        <TableHead>Stav</TableHead>
                        <TableHead>Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challenges.map((challenge) => (
                        <TableRow key={challenge.id} data-testid={`row-challenge-${challenge.id}`}>
                          <TableCell className="font-medium">{challenge.title}</TableCell>
                          <TableCell className="max-w-xs truncate">{challenge.description}</TableCell>
                          <TableCell>
                            {challenge.targetPhotos} / {challenge.points}b
                          </TableCell>
                          <TableCell>
                            <Badge variant={challenge.isActive ? "default" : "secondary"}>
                              {challenge.isActive ? "Aktivní" : "Neaktivní"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(challenge)}
                                data-testid={`button-edit-${challenge.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteChallengeMutation.mutate(challenge.id)}
                                disabled={deleteChallengeMutation.isPending}
                                data-testid={`button-delete-${challenge.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Správa fotek</CardTitle>
                <CardDescription>
                  Prohlížejte a moderujte nahrané fotky
                </CardDescription>
              </CardHeader>
              <CardContent>
                {photosLoading ? (
                  <div className="text-center py-8">Načítání fotek...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Náhled</TableHead>
                        <TableHead>Nahráno od</TableHead>
                        <TableHead>Výzva</TableHead>
                        <TableHead>Ověření</TableHead>
                        <TableHead>Srdíčka</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {photos.map((photo) => (
                        <TableRow key={photo.id} data-testid={`row-photo-${photo.id}`}>
                          <TableCell>
                            <img
                              src={`/api/photos/${photo.filename}`}
                              alt="Náhled"
                              className="w-16 h-16 object-cover rounded"
                              data-testid={`img-photo-${photo.id}`}
                            />
                          </TableCell>
                          <TableCell>{photo.uploaderName}</TableCell>
                          <TableCell>
                            {photo.questId ? (
                              <Badge variant="outline">
                                {challenges.find(c => c.id === photo.questId)?.title || "Neznámá výzva"}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Galerie</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {photo.isVerified ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">
                                {photo.verificationScore}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {photo.likes}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(photo.createdAt), "d.M.yyyy HH:mm", { locale: cs })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => 
                                  togglePhotoVerificationMutation.mutate({
                                    id: photo.id,
                                    isVerified: !photo.isVerified
                                  })
                                }
                                disabled={togglePhotoVerificationMutation.isPending}
                                data-testid={`button-verify-${photo.id}`}
                              >
                                {photo.isVerified ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deletePhotoMutation.mutate(photo.id)}
                                disabled={deletePhotoMutation.isPending}
                                data-testid={`button-delete-photo-${photo.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Pokrok uživatelů</CardTitle>
                <CardDescription>
                  Sledujte pokrok hostů ve výzvách
                </CardDescription>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div className="text-center py-8">Načítání pokroku...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Účastník</TableHead>
                        <TableHead>Výzva</TableHead>
                        <TableHead>Pokrok</TableHead>
                        <TableHead>Stav</TableHead>
                        <TableHead>Dokončeno</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progress.map((prog) => {
                        const challenge = challenges.find(c => c.id === prog.questId);
                        return (
                          <TableRow key={prog.id} data-testid={`row-progress-${prog.id}`}>
                            <TableCell>{prog.participantName}</TableCell>
                            <TableCell>{challenge?.title || "Neznámá výzva"}</TableCell>
                            <TableCell>
                              {prog.photosUploaded}/{challenge?.targetPhotos || 0}
                            </TableCell>
                            <TableCell>
                              <Badge variant={prog.isCompleted ? "default" : "secondary"}>
                                {prog.isCompleted ? "Dokončeno" : "Probíhá"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {prog.completedAt
                                ? format(new Date(prog.completedAt), "d.M.yyyy HH:mm", { locale: cs })
                                : "-"
                              }
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}