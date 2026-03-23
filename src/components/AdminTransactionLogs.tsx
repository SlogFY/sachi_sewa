import { useState, useEffect } from "react";
import { Receipt, Search, Download, Filter, Calendar, IndianRupee, ArrowUpDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: "one-time" | "monthly";
  donor_name: string;
  donor_email: string;
  donor_phone: string | null;
  amount: number;
  receipt_number: string;
  created_at: string;
  campaign_title?: string;
  plan_name?: string;
  status: "success" | "pending" | "failed";
}

const AdminTransactionLogs = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "one-time" | "monthly">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Fetch one-time donations
      const { data: donationsData, error: donationsError } = await supabase
        .from("donations")
        .select(`
          id,
          donor_name,
          donor_email,
          donor_phone,
          amount,
          receipt_number,
          created_at,
          campaigns!fk_donations_campaign (title)
        `)
        .order("created_at", { ascending: sortOrder === "asc" });

      if (donationsError) throw donationsError;

      // Fetch monthly donations
      const { data: monthlyData, error: monthlyError } = await supabase
        .from("monthly_donations")
        .select("*")
        .order("created_at", { ascending: sortOrder === "asc" });

      if (monthlyError) throw monthlyError;

      // Combine and format transactions
      const oneTimeTransactions: Transaction[] = (donationsData || []).map((d: any) => ({
        id: d.id,
        type: "one-time" as const,
        donor_name: d.donor_name,
        donor_email: d.donor_email,
        donor_phone: d.donor_phone,
        amount: d.amount,
        receipt_number: d.receipt_number,
        created_at: d.created_at,
        campaign_title: d.campaigns?.title,
        status: "success" as const,
      }));

      const monthlyTransactions: Transaction[] = (monthlyData || []).map((d) => ({
        id: d.id,
        type: "monthly" as const,
        donor_name: d.donor_name,
        donor_email: d.donor_email,
        donor_phone: d.donor_phone,
        amount: d.amount,
        receipt_number: d.receipt_number,
        created_at: d.created_at,
        plan_name: d.plan_name,
        status: "success" as const,
      }));

      const allTransactions = [...oneTimeTransactions, ...monthlyTransactions].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });

      setTransactions(allTransactions);
    } catch (error: any) {
      console.error("Fetch transactions error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [sortOrder]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDateFilteredTransactions = (txns: Transaction[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (dateFilter) {
      case "today":
        return txns.filter((t) => new Date(t.created_at) >= today);
      case "week":
        return txns.filter((t) => new Date(t.created_at) >= weekAgo);
      case "month":
        return txns.filter((t) => new Date(t.created_at) >= monthAgo);
      default:
        return txns;
    }
  };

  const filteredTransactions = getDateFilteredTransactions(transactions)
    .filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          t.donor_name.toLowerCase().includes(query) ||
          t.donor_email.toLowerCase().includes(query) ||
          t.receipt_number.toLowerCase().includes(query) ||
          (t.campaign_title && t.campaign_title.toLowerCase().includes(query)) ||
          (t.plan_name && t.plan_name.toLowerCase().includes(query))
        );
      }
      return true;
    });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const oneTimeTotal = filteredTransactions
    .filter((t) => t.type === "one-time")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyTotal = filteredTransactions
    .filter((t) => t.type === "monthly")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const exportToCSV = () => {
    const headers = ["Receipt No", "Date", "Type", "Donor Name", "Email", "Phone", "Amount", "Campaign/Plan"];
    const rows = filteredTransactions.map((t) => [
      t.receipt_number,
      formatDate(t.created_at),
      t.type === "one-time" ? "One-Time" : "Monthly",
      t.donor_name,
      t.donor_email,
      t.donor_phone || "-",
      t.amount,
      t.campaign_title || t.plan_name || "-",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Transaction logs exported to CSV",
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Collections</CardDescription>
            <CardTitle className="text-2xl text-primary">{formatCurrency(totalAmount)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{filteredTransactions.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>One-Time Donations</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(oneTimeTotal)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.filter((t) => t.type === "one-time").length} donations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Donations</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(monthlyTotal)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.filter((t) => t.type === "monthly").length} subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Transaction Logs
              </CardTitle>
              <CardDescription>Complete payment history and transaction details</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, receipt number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="one-time">One-Time</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Transactions Table */}
          <ScrollArea className="h-[500px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Donor Details</TableHead>
                  <TableHead>Campaign / Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading transactions...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">{transaction.receipt_number}</TableCell>
                      <TableCell className="text-sm">{formatDate(transaction.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === "one-time" ? "default" : "secondary"}>
                          {transaction.type === "one-time" ? "One-Time" : "Monthly"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm">{transaction.donor_name}</p>
                          <p className="text-xs text-muted-foreground">{transaction.donor_email}</p>
                          {transaction.donor_phone && (
                            <p className="text-xs text-muted-foreground">{transaction.donor_phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.campaign_title || transaction.plan_name || "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className="flex items-center justify-end gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {Number(transaction.amount).toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          Success
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTransactionLogs;
