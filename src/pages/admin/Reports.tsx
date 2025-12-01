import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { format, subDays, startOfQuarter, startOfYear } from 'date-fns';
import { CalendarIcon, FileDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  orderVolume?: any;
  productionPipeline?: any;
  teamAssignments?: any;
  priorityBreakdown?: any;
  clientStatistics?: any;
  orderSpecifications?: any;
}

export default function Reports() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCategories, setSelectedCategories] = useState({
    orderVolume: false,
    productionPipeline: false,
    teamAssignments: false,
    priorityBreakdown: false,
    clientStatistics: false,
    orderSpecifications: false,
  });
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'both'>('pdf');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const handleQuickSelect = (days: number | 'quarter' | 'year') => {
    const today = new Date();
    setEndDate(today);
    
    if (days === 'quarter') {
      setStartDate(startOfQuarter(today));
    } else if (days === 'year') {
      setStartDate(startOfYear(today));
    } else {
      setStartDate(subDays(today, days));
    }
  };

  const toggleCategory = (category: keyof typeof selectedCategories) => {
    setSelectedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const fetchReportData = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Date Range Required',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }

    const hasCategory = Object.values(selectedCategories).some(v => v);
    if (!hasCategory) {
      toast({
        title: 'Category Required',
        description: 'Please select at least one report category',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const data: ReportData = {};

    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      if (selectedCategories.orderVolume) {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, created_at')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr);

        if (!error && orders) {
          const statusCounts: Record<string, number> = {};
          orders.forEach(order => {
            statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
          });

          const completed = statusCounts['completed'] || 0;
          const total = orders.length;

          data.orderVolume = {
            total,
            statusCounts,
            completed,
            newOrders: total - completed,
          };
        }
      }

      if (selectedCategories.productionPipeline) {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('status');

        if (!error && orders) {
          const pipeline: Record<string, number> = {};
          orders.forEach(order => {
            pipeline[order.status] = (pipeline[order.status] || 0) + 1;
          });

          data.productionPipeline = {
            currentPipeline: pipeline,
            completed: pipeline['completed'] || 0,
            delayed: pipeline['delayed'] || 0,
            inProgress: orders.length - (pipeline['completed'] || 0) - (pipeline['pending_quote'] || 0),
          };
        }
      }

      if (selectedCategories.teamAssignments) {
        const { data: assignments, error } = await supabase
          .from('order_team_assignments')
          .select('team_member_id, team_members(name, department, status)');

        const { data: allTeamMembers } = await supabase
          .from('team_members')
          .select('id, name, status, availability');

        if (!error && assignments && allTeamMembers) {
          // Count assignments per team member
          const memberAssignmentCounts: Record<string, number> = {};
          assignments.forEach((a: any) => {
            const memberId = a.team_member_id;
            memberAssignmentCounts[memberId] = (memberAssignmentCounts[memberId] || 0) + 1;
          });

          // Build member list with assignment counts
          const allMembersWithCounts = allTeamMembers.map(tm => ({
            name: tm.name,
            status: tm.status || 'unknown',
            availability: tm.availability || 'unknown',
            assignedOrders: memberAssignmentCounts[tm.id] || 0,
          }));

          // Status counts
          const statusCounts = {
            active: allTeamMembers.filter(m => m.status === 'active').length,
            busy: allTeamMembers.filter(m => m.availability === 'busy').length,
            available: allTeamMembers.filter(m => m.availability === 'available').length,
            onLeave: allTeamMembers.filter(m => m.status === 'on_leave' || m.availability === 'on_leave').length,
          };

          data.teamAssignments = {
            allMembers: allMembersWithCounts,
            statusCounts,
            totalMembers: allTeamMembers.length,
          };
        }
      }

      if (selectedCategories.priorityBreakdown) {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('priority')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr);

        if (!error && orders) {
          const priorityCounts: Record<string, number> = {};
          orders.forEach(order => {
            priorityCounts[order.priority] = (priorityCounts[order.priority] || 0) + 1;
          });

          const urgent = priorityCounts['urgent'] || 0;
          const total = orders.length;

          data.priorityBreakdown = {
            priorityCounts,
            urgentRatio: total > 0 ? ((urgent / total) * 100).toFixed(1) : '0',
          };
        }
      }

      if (selectedCategories.clientStatistics) {
        // Get all profiles
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Get user roles to identify admins
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
        }

        // Get team members to exclude them
        const { data: teamMembers, error: teamError } = await supabase
          .from('team_members')
          .select('user_id');

        if (teamError) {
          console.error('Error fetching team members:', teamError);
        }

        // Filter to only actual clients (exclude admins and team members)
        const teamMemberIds = new Set((teamMembers || []).map(tm => tm.user_id).filter(Boolean));
        const allClients = (allProfiles || []).filter(profile => {
          // Exclude team members
          if (teamMemberIds.has(profile.id)) return false;
          
          // Exclude admins
          const isAdmin = (userRoles || []).some(
            role => role.user_id === profile.id && role.role === 'admin'
          );
          if (isAdmin) return false;
          
          return true;
        });

        const clientIds = allClients.map(c => c.id);

        // Get orders in date range
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('user_id, created_at')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr);

        if (ordersError) {
          console.error('Error fetching orders for client stats:', ordersError);
        }

        // Count new clients created in date range
        const newClientsCount = allClients.filter(client => {
          const createdAt = allProfiles?.find(p => p.id === client.id);
          if (!createdAt) return false;
          const created = new Date((createdAt as any).created_at || '');
          return created >= new Date(startDateStr) && created <= new Date(endDateStr);
        }).length;

        if (orders && allClients) {
          // Count orders per client and track active clients
          const userOrderCounts: Record<string, number> = {};
          const activeClientIds = new Set<string>();
          
          orders.forEach((order) => {
            const userId = order.user_id;
            // Only count if user is a client
            if (clientIds.includes(userId)) {
              userOrderCounts[userId] = (userOrderCounts[userId] || 0) + 1;
              activeClientIds.add(userId);
            }
          });

          // Get profile names for top clients
          const topClientData = await Promise.all(
            Object.entries(userOrderCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(async ([userId, count]) => {
                const profile = allClients.find(c => c.id === userId);
                return [profile?.full_name || 'Unknown', count] as [string, number];
              })
          );

          const totalClients = allClients.length;
          const activeCount = activeClientIds.size;
          const inactiveCount = totalClients - activeCount;

          data.clientStatistics = {
            totalClients,
            activeClients: activeCount,
            inactiveClients: inactiveCount,
            newClients: newClientsCount,
            topClients: topClientData,
          };

          console.log('Client Statistics:', data.clientStatistics);
        } else {
          console.log('No orders or clients data available');
        }
      }

      if (selectedCategories.orderSpecifications) {
        const { data: customizations, error } = await supabase
          .from('order_customizations')
          .select('finish, texture, color, order_id, orders!inner(created_at, quantity)')
          .gte('orders.created_at', startDateStr)
          .lte('orders.created_at', endDateStr);

        if (!error && customizations) {
          const finishCounts: Record<string, number> = {};
          const textureCounts: Record<string, number> = {};
          const colorCounts: Record<string, number> = {};
          let totalQuantity = 0;

          customizations.forEach((c: any) => {
            finishCounts[c.finish] = (finishCounts[c.finish] || 0) + 1;
            textureCounts[c.texture] = (textureCounts[c.texture] || 0) + 1;
            colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
            totalQuantity += c.orders?.quantity || 0;
          });

          const topColors = Object.entries(colorCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

          data.orderSpecifications = {
            finishCounts,
            textureCounts,
            topColors,
            totalQuantity,
          };
        }
      }

      setReportData(data);
      toast({
        title: 'Report Generated',
        description: 'Your report has been generated successfully',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!reportData || !startDate || !endDate) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP Powder Coating Reports', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`, 105, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 105, yPos, { align: 'center' });
    yPos += 15;

    // Order Volume
    if (reportData.orderVolume) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Order Volume & Status', 14, yPos);
      yPos += 10;

      const statusData = Object.entries(reportData.orderVolume.statusCounts).map(([status, count]) => [
        status.replace('-', ' ').replace('_', ' ').toUpperCase(),
        count
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Status', 'Count']],
        body: statusData,
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Stage Distribution
    if (reportData.productionPipeline) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Stage Distribution', 14, yPos);
      yPos += 10;

      const stageData = Object.entries(reportData.productionPipeline.currentPipeline).map(([stage, count]) => [
        stage.replace('-', ' ').replace('_', ' ').toUpperCase(),
        count
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Stage', 'Count']],
        body: stageData,
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Team Assignments
    if (reportData.teamAssignments) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Team Assignments', 14, yPos);
      yPos += 10;

      // Status summary
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Status Summary: Active: ${reportData.teamAssignments.statusCounts.active}, ` +
        `On Leave: ${reportData.teamAssignments.statusCounts.onLeave}, ` +
        `Busy: ${reportData.teamAssignments.statusCounts.busy}, ` +
        `Available: ${reportData.teamAssignments.statusCounts.available}`,
        14,
        yPos
      );
      yPos += 7;

      const memberData = reportData.teamAssignments.allMembers.map((m: any) => [
        m.name,
        m.status.toUpperCase(),
        m.availability.toUpperCase(),
        m.assignedOrders
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Team Member', 'Status', 'Availability', 'Assigned Orders']],
        body: memberData,
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Priority Breakdown
    if (reportData.priorityBreakdown) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Priority Breakdown', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Urgent Ratio: ${reportData.priorityBreakdown.urgentRatio}%`, 14, yPos);
      yPos += 7;

      const priorityData = Object.entries(reportData.priorityBreakdown.priorityCounts).map(([priority, count]) => [
        priority.toUpperCase(),
        count
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Priority', 'Count']],
        body: priorityData,
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Client Statistics
    if (reportData.clientStatistics) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Client Statistics', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Total Clients: ${reportData.clientStatistics.totalClients} | ` +
        `Active: ${reportData.clientStatistics.activeClients} | ` +
        `Inactive: ${reportData.clientStatistics.inactiveClients} | ` +
        `New: ${reportData.clientStatistics.newClients}`,
        14,
        yPos
      );
      yPos += 7;

      autoTable(doc, {
        startY: yPos,
        head: [['Top Clients (by Orders)', 'Order Count']],
        body: reportData.clientStatistics.topClients,
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Order Specifications
    if (reportData.orderSpecifications) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Order Specifications', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Items Processed: ${reportData.orderSpecifications.totalQuantity}`, 14, yPos);
      yPos += 7;

      const finishData = Object.entries(reportData.orderSpecifications.finishCounts).map(([finish, count]) => [
        finish.toUpperCase(),
        count
      ]);
      const finishTotal = finishData.reduce((sum, [, count]) => sum + (count as number), 0);

      autoTable(doc, {
        startY: yPos,
        head: [['Finish Type', 'Count']],
        body: [...finishData, ['TOTAL', finishTotal]],
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;

      const textureData = Object.entries(reportData.orderSpecifications.textureCounts).map(([texture, count]) => [
        texture.toUpperCase(),
        count
      ]);
      const textureTotal = textureData.reduce((sum, [, count]) => sum + (count as number), 0);

      autoTable(doc, {
        startY: yPos,
        head: [['Texture Type', 'Count']],
        body: [...textureData, ['TOTAL', textureTotal]],
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;

      const colorTotal = reportData.orderSpecifications.topColors.reduce((sum: number, [, count]: [string, number]) => sum + count, 0);

      autoTable(doc, {
        startY: yPos,
        head: [['Top Colors', 'Count']],
        body: [...reportData.orderSpecifications.topColors, ['TOTAL (Top 5)', colorTotal]],
        theme: 'grid',
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`TOP_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    toast({
      title: 'PDF Downloaded',
      description: 'Your report has been downloaded as PDF',
    });
  };

  const generateCSV = () => {
    if (!reportData || !startDate || !endDate) return;

    let csv = `TOP Powder Coating Reports\n`;
    csv += `Report Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}\n`;
    csv += `Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}\n\n`;

    if (reportData.orderVolume) {
      csv += 'Order Volume & Status\n';
      csv += 'Status,Count\n';
      Object.entries(reportData.orderVolume.statusCounts).forEach(([status, count]) => {
        csv += `${status},${count}\n`;
      });
      csv += '\n';
    }

    if (reportData.productionPipeline) {
      csv += 'Stage Distribution\n';
      csv += 'Stage,Count\n';
      Object.entries(reportData.productionPipeline.currentPipeline).forEach(([stage, count]) => {
        csv += `${stage},${count}\n`;
      });
      csv += '\n';
    }

    if (reportData.teamAssignments) {
      csv += 'Team Assignments\n';
      csv += `Status Summary: Active: ${reportData.teamAssignments.statusCounts.active}, On Leave: ${reportData.teamAssignments.statusCounts.onLeave}, Busy: ${reportData.teamAssignments.statusCounts.busy}, Available: ${reportData.teamAssignments.statusCounts.available}\n`;
      csv += 'Team Member,Status,Availability,Assigned Orders\n';
      reportData.teamAssignments.allMembers.forEach((m: any) => {
        csv += `${m.name},${m.status},${m.availability},${m.assignedOrders}\n`;
      });
      csv += '\n';
    }

    if (reportData.priorityBreakdown) {
      csv += 'Priority Breakdown\n';
      csv += `Urgent Ratio: ${reportData.priorityBreakdown.urgentRatio}%\n`;
      csv += 'Priority,Count\n';
      Object.entries(reportData.priorityBreakdown.priorityCounts).forEach(([priority, count]) => {
        csv += `${priority},${count}\n`;
      });
      csv += '\n';
    }

    if (reportData.clientStatistics) {
      csv += 'Client Statistics\n';
      csv += `Total Clients: ${reportData.clientStatistics.totalClients}\n`;
      csv += `Active Clients: ${reportData.clientStatistics.activeClients}\n`;
      csv += `Inactive Clients: ${reportData.clientStatistics.inactiveClients}\n`;
      csv += `New Clients: ${reportData.clientStatistics.newClients}\n\n`;
      csv += 'Top Clients (by Orders),Order Count\n';
      reportData.clientStatistics.topClients.forEach(([name, count]: [string, number]) => {
        csv += `${name},${count}\n`;
      });
      csv += '\n';
    }

    if (reportData.orderSpecifications) {
      csv += 'Order Specifications - Finish Types\n';
      csv += 'Finish,Count\n';
      Object.entries(reportData.orderSpecifications.finishCounts).forEach(([finish, count]) => {
        csv += `${finish},${count}\n`;
      });
      csv += '\n';

      csv += 'Order Specifications - Texture Types\n';
      csv += 'Texture,Count\n';
      Object.entries(reportData.orderSpecifications.textureCounts).forEach(([texture, count]) => {
        csv += `${texture},${count}\n`;
      });
      csv += '\n';

      csv += 'Order Specifications - Top Colors\n';
      csv += 'Color,Count\n';
      reportData.orderSpecifications.topColors.forEach(([color, count]: [string, number]) => {
        csv += `${color},${count}\n`;
      });
      csv += '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TOP_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'CSV Downloaded',
      description: 'Your report has been downloaded as CSV',
    });
  };

  const handleDownload = () => {
    if (exportFormat === 'pdf') {
      generatePDF();
    } else if (exportFormat === 'csv') {
      generateCSV();
    } else {
      generatePDF();
      generateCSV();
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Generate Reports</h1>
          <p className="text-muted-foreground">Generate operational reports for order tracking and team performance</p>
        </div>

        {/* Configuration Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Select date range, categories, and format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Date Range</Label>
              <div className="flex flex-wrap gap-3 mb-4">
                <Button variant="outline" size="sm" onClick={() => handleQuickSelect(7)}>
                  Last 7 Days
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSelect(30)}>
                  Last 30 Days
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSelect('quarter')}>
                  This Quarter
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSelect('year')}>
                  This Year
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="mb-2 block">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Report Categories */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Report Categories</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orderVolume"
                    checked={selectedCategories.orderVolume}
                    onCheckedChange={() => toggleCategory('orderVolume')}
                  />
                  <Label htmlFor="orderVolume" className="cursor-pointer">
                    Order Volume & Status
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="productionPipeline"
                    checked={selectedCategories.productionPipeline}
                    onCheckedChange={() => toggleCategory('productionPipeline')}
                  />
                  <Label htmlFor="productionPipeline" className="cursor-pointer">
                    Stage Distribution
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="teamAssignments"
                    checked={selectedCategories.teamAssignments}
                    onCheckedChange={() => toggleCategory('teamAssignments')}
                  />
                  <Label htmlFor="teamAssignments" className="cursor-pointer">
                    Team Assignments
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="priorityBreakdown"
                    checked={selectedCategories.priorityBreakdown}
                    onCheckedChange={() => toggleCategory('priorityBreakdown')}
                  />
                  <Label htmlFor="priorityBreakdown" className="cursor-pointer">
                    Priority Breakdown
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="clientStatistics"
                    checked={selectedCategories.clientStatistics}
                    onCheckedChange={() => toggleCategory('clientStatistics')}
                  />
                  <Label htmlFor="clientStatistics" className="cursor-pointer">
                    Client Statistics
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orderSpecifications"
                    checked={selectedCategories.orderSpecifications}
                    onCheckedChange={() => toggleCategory('orderSpecifications')}
                  />
                  <Label htmlFor="orderSpecifications" className="cursor-pointer">
                    Order Specifications
                  </Label>
                </div>
              </div>
            </div>

            {/* Format Options */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Format</Label>
              <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="cursor-pointer">PDF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="cursor-pointer">Excel (CSV)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="cursor-pointer">Both</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Generate Button */}
            <Button
              onClick={fetchReportData}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {reportData && (
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>Review your report summary before downloading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {reportData.orderVolume && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Volume & Status</h3>
                  <p className="text-sm font-medium mb-2">Total Orders: {reportData.orderVolume.total}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(reportData.orderVolume.statusCounts).map(([status, count]) => (
                      <div key={status} className="flex justify-between p-2 border border-border rounded text-sm">
                        <span className="capitalize">{status.replace('-', ' ').replace('_', ' ')}</span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.productionPipeline && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Stage Distribution</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {Object.entries(reportData.productionPipeline.currentPipeline).map(([stage, count]) => (
                      <div key={stage} className="flex justify-between p-2 border border-border rounded">
                        <span className="capitalize">{stage.replace('-', ' ').replace('_', ' ')}</span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.teamAssignments && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Team Assignments</h3>
                  <div className="mb-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Status Summary:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Active: <span className="font-semibold">{reportData.teamAssignments.statusCounts.active}</span></div>
                      <div>On Leave: <span className="font-semibold">{reportData.teamAssignments.statusCounts.onLeave}</span></div>
                      <div>Busy: <span className="font-semibold">{reportData.teamAssignments.statusCounts.busy}</span></div>
                      <div>Available: <span className="font-semibold">{reportData.teamAssignments.statusCounts.available}</span></div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Total Members: {reportData.teamAssignments.totalMembers}</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {reportData.teamAssignments.allMembers.slice(0, 5).map((member: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 border border-border rounded text-sm">
                        <div className="flex-1">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.status} • {member.availability}</div>
                        </div>
                        <span className="font-medium">{member.assignedOrders} orders</span>
                      </div>
                    ))}
                    {reportData.teamAssignments.allMembers.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        + {reportData.teamAssignments.allMembers.length - 5} more members (see full report)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {reportData.priorityBreakdown && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Priority Breakdown</h3>
                  <p className="text-sm font-medium mb-2">Urgent Ratio: {reportData.priorityBreakdown.urgentRatio}%</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(reportData.priorityBreakdown.priorityCounts).map(([priority, count]) => (
                      <div key={priority} className="flex justify-between p-2 border border-border rounded text-sm">
                        <span className="capitalize">{priority}</span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.clientStatistics && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Client Statistics</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Clients</p>
                      <p className="text-2xl font-bold">{reportData.clientStatistics.totalClients}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Active Clients</p>
                      <p className="text-2xl font-bold text-green-600">{reportData.clientStatistics.activeClients}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Inactive Clients</p>
                      <p className="text-2xl font-bold text-orange-600">{reportData.clientStatistics.inactiveClients}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">New Clients</p>
                      <p className="text-2xl font-bold text-blue-600">{reportData.clientStatistics.newClients}</p>
                    </div>
                  </div>
                  {reportData.clientStatistics.topClients && reportData.clientStatistics.topClients.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Top Clients by Order Count:</p>
                      {reportData.clientStatistics.topClients.slice(0, 5).map(([name, count]: [string, number], idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2 border border-border rounded bg-card">
                          <span className="text-sm">{name}</span>
                          <span className="text-sm font-medium">{count} orders</span>
                        </div>
                      ))}
                      {reportData.clientStatistics.topClients.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                          + {reportData.clientStatistics.topClients.length - 5} more clients (see full report)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {reportData.orderSpecifications && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Specifications</h3>
                  <p className="text-sm font-medium mb-3">Total Items Processed: {reportData.orderSpecifications.totalQuantity}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Finish Types:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(reportData.orderSpecifications.finishCounts).map(([finish, count]) => (
                          <div key={finish} className="flex justify-between p-2 border border-border rounded text-sm">
                            <span className="capitalize">{finish}</span>
                            <span className="font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Texture Types:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(reportData.orderSpecifications.textureCounts).map(([texture, count]) => (
                          <div key={texture} className="flex justify-between p-2 border border-border rounded text-sm">
                            <span className="capitalize">{texture}</span>
                            <span className="font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Top 5 Colors:</p>
                      <div className="space-y-2">
                        {reportData.orderSpecifications.topColors.map(([color, count]: [string, number], idx: number) => (
                          <div key={idx} className="flex justify-between p-2 border border-border rounded text-sm">
                            <span>{color}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleDownload} className="w-full" size="lg">
                <FileDown className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
