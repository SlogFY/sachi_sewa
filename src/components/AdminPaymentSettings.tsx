import { useState, useEffect } from "react";
import { Loader2, Save, CreditCard, Shield, Eye, EyeOff, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentGateway {
  id: string;
  name: string;
  display_name: string;
  key_id: string;
  key_secret: string;
  merchant_id?: string;
  salt_key?: string;
  is_active: boolean;
  is_test_mode: boolean;
  webhook_url?: string;
}

const GATEWAY_OPTIONS = [
  { value: "razorpay", label: "Razorpay", fields: ["key_id", "key_secret"] },
  { value: "payu", label: "PayU", fields: ["key_id", "key_secret", "merchant_id", "salt_key"] },
  { value: "phonepe", label: "PhonePe", fields: ["merchant_id", "salt_key", "key_id"] },
  { value: "cashfree", label: "Cashfree", fields: ["key_id", "key_secret"] },
  { value: "instamojo", label: "Instamojo", fields: ["key_id", "key_secret", "salt_key"] },
];

const FIELD_LABELS: Record<string, { label: string; placeholder: string }> = {
  key_id: { label: "API Key / Key ID", placeholder: "Enter API Key" },
  key_secret: { label: "API Secret / Key Secret", placeholder: "Enter API Secret" },
  merchant_id: { label: "Merchant ID", placeholder: "Enter Merchant ID" },
  salt_key: { label: "Salt Key", placeholder: "Enter Salt Key" },
  webhook_url: { label: "Webhook URL", placeholder: "https://your-domain.com/webhook" },
};

const AdminPaymentSettings = () => {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [showAddGateway, setShowAddGateway] = useState(false);
  const [deleteGateway, setDeleteGateway] = useState<PaymentGateway | null>(null);
  const [newGateway, setNewGateway] = useState<Partial<PaymentGateway>>({
    name: "",
    display_name: "",
    key_id: "",
    key_secret: "",
    merchant_id: "",
    salt_key: "",
    is_active: false,
    is_test_mode: true,
  });

  const fetchGateways = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "payment_gateways")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        try {
          const parsed = JSON.parse(data.value);
          setGateways(Array.isArray(parsed) ? parsed : []);
        } catch {
          setGateways([]);
        }
      } else {
        setGateways([]);
      }
    } catch (error: any) {
      console.error("Fetch gateways error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payment gateways",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const saveGateways = async (updatedGateways: PaymentGateway[]) => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "payment_gateways")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: JSON.stringify(updatedGateways) })
          .eq("key", "payment_gateways");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({
            key: "payment_gateways",
            value: JSON.stringify(updatedGateways),
            description: "Payment gateway configurations",
          });
        if (error) throw error;
      }

      setGateways(updatedGateways);
      toast({
        title: "Settings Saved",
        description: "Payment gateway settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error("Save gateways error:", error);
      toast({
        title: "Error",
        description: "Failed to save payment gateway settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGateway = async () => {
    if (!newGateway.name || !newGateway.key_id) {
      toast({
        title: "Error",
        description: "Please select a gateway and fill in required fields",
        variant: "destructive",
      });
      return;
    }

    const gatewayConfig = GATEWAY_OPTIONS.find(g => g.value === newGateway.name);
    const gateway: PaymentGateway = {
      id: `gateway_${Date.now()}`,
      name: newGateway.name,
      display_name: gatewayConfig?.label || newGateway.name,
      key_id: newGateway.key_id || "",
      key_secret: newGateway.key_secret || "",
      merchant_id: newGateway.merchant_id,
      salt_key: newGateway.salt_key,
      is_active: newGateway.is_active || false,
      is_test_mode: newGateway.is_test_mode ?? true,
      webhook_url: newGateway.webhook_url,
    };

    const updatedGateways = [...gateways, gateway];
    await saveGateways(updatedGateways);
    
    setNewGateway({
      name: "",
      display_name: "",
      key_id: "",
      key_secret: "",
      merchant_id: "",
      salt_key: "",
      is_active: false,
      is_test_mode: true,
    });
    setShowAddGateway(false);
  };

  const handleUpdateGateway = (id: string, field: keyof PaymentGateway, value: any) => {
    setGateways(prev => 
      prev.map(g => g.id === id ? { ...g, [field]: value } : g)
    );
  };

  const handleSaveChanges = async () => {
    await saveGateways(gateways);
  };

  const handleDeleteGateway = async () => {
    if (!deleteGateway) return;
    
    const updatedGateways = gateways.filter(g => g.id !== deleteGateway.id);
    await saveGateways(updatedGateways);
    setDeleteGateway(null);
  };

  const handleSetActive = async (id: string) => {
    const updatedGateways = gateways.map(g => ({
      ...g,
      is_active: g.id === id,
    }));
    await saveGateways(updatedGateways);
  };

  const toggleShowSecret = (gatewayId: string, field: string) => {
    const key = `${gatewayId}_${field}`;
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getRequiredFields = (gatewayName: string) => {
    return GATEWAY_OPTIONS.find(g => g.value === gatewayName)?.fields || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Payment Gateway Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure payment gateways to accept donations
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddGateway(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Gateway
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Active Gateway Info */}
      {gateways.some(g => g.is_active) && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-700 dark:text-green-400 font-medium">
              Active Gateway: {gateways.find(g => g.is_active)?.display_name}
            </span>
            {gateways.find(g => g.is_active)?.is_test_mode && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                Test Mode
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Gateway List */}
      {gateways.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Payment Gateways Configured</h3>
          <p className="text-muted-foreground mb-4">
            Add a payment gateway to start accepting donations
          </p>
          <Button onClick={() => setShowAddGateway(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Gateway
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {gateways.map((gateway) => (
            <Card key={gateway.id} className={gateway.is_active ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{gateway.display_name}</CardTitle>
                    {gateway.is_active && (
                      <Badge className="bg-green-500">Active</Badge>
                    )}
                    {gateway.is_test_mode && (
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                        Test Mode
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!gateway.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(gateway.id)}
                      >
                        Set as Active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteGateway(gateway)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Configure your {gateway.display_name} integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Key ID */}
                  <div className="space-y-2">
                    <Label>API Key / Key ID</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets[`${gateway.id}_key_id`] ? "text" : "password"}
                        value={gateway.key_id}
                        onChange={(e) => handleUpdateGateway(gateway.id, "key_id", e.target.value)}
                        placeholder="Enter API Key"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowSecret(gateway.id, "key_id")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets[`${gateway.id}_key_id`] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Key Secret */}
                  <div className="space-y-2">
                    <Label>API Secret / Key Secret</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets[`${gateway.id}_key_secret`] ? "text" : "password"}
                        value={gateway.key_secret}
                        onChange={(e) => handleUpdateGateway(gateway.id, "key_secret", e.target.value)}
                        placeholder="Enter API Secret"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowSecret(gateway.id, "key_secret")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets[`${gateway.id}_key_secret`] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Merchant ID (if applicable) */}
                  {getRequiredFields(gateway.name).includes("merchant_id") && (
                    <div className="space-y-2">
                      <Label>Merchant ID</Label>
                      <Input
                        value={gateway.merchant_id || ""}
                        onChange={(e) => handleUpdateGateway(gateway.id, "merchant_id", e.target.value)}
                        placeholder="Enter Merchant ID"
                      />
                    </div>
                  )}

                  {/* Salt Key (if applicable) */}
                  {getRequiredFields(gateway.name).includes("salt_key") && (
                    <div className="space-y-2">
                      <Label>Salt Key</Label>
                      <div className="relative">
                        <Input
                          type={showSecrets[`${gateway.id}_salt_key`] ? "text" : "password"}
                          value={gateway.salt_key || ""}
                          onChange={(e) => handleUpdateGateway(gateway.id, "salt_key", e.target.value)}
                          placeholder="Enter Salt Key"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowSecret(gateway.id, "salt_key")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSecrets[`${gateway.id}_salt_key`] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Mode Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Test Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Use test credentials for development
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={gateway.is_test_mode}
                    onCheckedChange={(checked) => handleUpdateGateway(gateway.id, "is_test_mode", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Gateway Dialog */}
      {showAddGateway && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Add Payment Gateway</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Gateway</Label>
                <Select
                  value={newGateway.name}
                  onValueChange={(value) => setNewGateway(prev => ({ ...prev, name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a payment gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    {GATEWAY_OPTIONS.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        disabled={gateways.some(g => g.name === option.value)}
                      >
                        {option.label}
                        {gateways.some(g => g.name === option.value) && " (Already added)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newGateway.name && (
                <>
                  {getRequiredFields(newGateway.name).map((field) => (
                    <div key={field} className="space-y-2">
                      <Label>{FIELD_LABELS[field]?.label || field}</Label>
                      <Input
                        type={field.includes("secret") || field.includes("salt") ? "password" : "text"}
                        value={(newGateway as any)[field] || ""}
                        onChange={(e) => setNewGateway(prev => ({ ...prev, [field]: e.target.value }))}
                        placeholder={FIELD_LABELS[field]?.placeholder || `Enter ${field}`}
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="font-medium">Test Mode</p>
                      <p className="text-sm text-muted-foreground">Start with test credentials</p>
                    </div>
                    <Switch
                      checked={newGateway.is_test_mode}
                      onCheckedChange={(checked) => setNewGateway(prev => ({ ...prev, is_test_mode: checked }))}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddGateway(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAddGateway}
                disabled={!newGateway.name || !newGateway.key_id}
              >
                Add Gateway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteGateway} onOpenChange={() => setDeleteGateway(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteGateway?.display_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGateway}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPaymentSettings;
