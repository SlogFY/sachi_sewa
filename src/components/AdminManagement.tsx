import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Loader2, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Admin {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    email: string | null;
    full_name: string | null;
  };
}

const AdminManagement = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Check if current user is owner
        const { data: ownerCheck } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "owner")
          .maybeSingle();
        
        setIsOwner(!!ownerCheck);
      }

      // Fetch all admin/owner roles that the current user can see
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .in("role", ["admin", "owner"])
        .order("created_at", { ascending: true });

      if (rolesError) throw rolesError;

      // Fetch profiles for these users
      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(r => r.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, email, full_name")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Merge profiles with roles
        const adminsWithProfiles = rolesData.map(role => ({
          ...role,
          profile: profilesData?.find(p => p.user_id === role.user_id) || null,
        }));

        setAdmins(adminsWithProfiles);
      } else {
        setAdmins([]);
      }
    } catch (error: any) {
      console.error("Fetch admins error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch admin list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      // Find user by email in profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", newAdminEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        toast({
          title: "User Not Found",
          description: "No user found with this email. They need to sign up first.",
          variant: "destructive",
        });
        setIsAdding(false);
        return;
      }

      // Check if user already has admin/owner role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", profileData.user_id)
        .in("role", ["admin", "owner"])
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Already Admin",
          description: "This user is already an admin",
          variant: "destructive",
        });
        setIsAdding(false);
        return;
      }

      // Add admin role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profileData.user_id,
          role: "admin",
        });

      if (insertError) throw insertError;

      toast({
        title: "Admin Added! ✅",
        description: `${newAdminEmail} is now an admin`,
      });

      setNewAdminEmail("");
      setShowAddDialog(false);
      fetchAdmins();
    } catch (error: any) {
      console.error("Add admin error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add admin",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedAdmin) return;

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", selectedAdmin.id);

      if (error) throw error;

      toast({
        title: "Admin Removed",
        description: `${selectedAdmin.profile?.email || "User"} is no longer an admin`,
      });

      setSelectedAdmin(null);
      setShowRemoveDialog(false);
      fetchAdmins();
    } catch (error: any) {
      console.error("Remove admin error:", error);
      toast({
        title: "Error",
        description: "Failed to remove admin",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "owner") {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    );
  };

  const canRemoveAdmin = (admin: Admin) => {
    // Owner can remove anyone except themselves
    if (isOwner && admin.user_id !== currentUserId) {
      return true;
    }
    // Admins can remove other admins (not owner, handled by RLS)
    if (!isOwner && admin.role === "admin" && admin.user_id !== currentUserId) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Admin Management</h2>
            <p className="text-sm text-muted-foreground">
              {isOwner ? "Manage all admins (Owner access)" : "Manage admin accounts"}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Admin List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No admins found
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.profile?.full_name || "—"}
                    </TableCell>
                    <TableCell>{admin.profile?.email || "—"}</TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell>
                      {new Date(admin.created_at).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      {canRemoveAdmin(admin) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setShowRemoveDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {admin.user_id === currentUserId ? "You" : "Protected"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
            <DialogDescription>
              Enter the email of the user you want to make an admin. They must have an account first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="user@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Confirmation */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedAdmin?.profile?.email || "this user"} as an admin?
              They will lose all admin privileges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveAdmin} disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagement;
