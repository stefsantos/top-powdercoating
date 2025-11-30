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
  delayedOrders?: any;
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
    delayedOrders: false,
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

        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('status');

        if (!error && assignments && teamMembers) {
          const memberCounts: Record<string, number> = {};
          const deptCounts: Record<string, number> = {};

          assignments.forEach((a: any) => {
            const name = a.team_members?.name || 'Unknown';
            const dept = a.team_members?.department || 'Unknown';
            memberCounts[name] = (memberCounts[name] || 0) + 1;
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
          });

          const active = teamMembers.filter(m => m.status === 'active').length;
          const inactive = teamMembers.length - active;

          data.teamAssignments = {
            memberCounts,
            deptCounts,
            activeMembers: active,
            inactiveMembers: inactive,
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
        const { data: orders, error } = await supabase
          .from('orders')
          .select('user_id, profiles(full_name)')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr);

        const { data: newProfiles } = await supabase
          .from('profiles')
          .select('id')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr);

        if (!error && orders) {
          const clientCounts: Record<string, number> = {};
          orders.forEach((o: any) => {
            const name = o.profiles?.full_name || 'Unknown';
            clientCounts[name] = (clientCounts[name] || 0) + 1;
          });

          const sorted = Object.entries(clientCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

          data.clientStatistics = {
            activeClients: Object.keys(clientCounts).length,
            topClients: sorted,
            newClients: newProfiles?.length || 0,
          };
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

      if (selectedCategories.delayedOrders) {
        const { data: delayedOrders, error } = await supabase
          .from('orders')
          .select('order_number, project_name, description, submitted_date, estimated_completion, priority, user_id, profiles!inner(full_name)')
          .eq('status', 'delayed')
          .gte('submitted_date', startDateStr)
          .lte('submitted_date', endDateStr)
          .order('submitted_date', { ascending: false });

        if (!error && delayedOrders) {
          data.delayedOrders = {
            count: delayedOrders.length,
            orders: delayedOrders.map((order: any) => ({
              orderNumber: order.order_number,
              projectName: order.project_name,
              description: order.description,
              clientName: order.profiles?.full_name || 'Unknown',
              submittedDate: format(new Date(order.submitted_date), 'MMM dd, yyyy'),
              estimatedCompletion: order.estimated_completion 
                ? format(new Date(order.estimated_completion), 'MMM dd, yyyy')
                : 'Not set',
              priority: order.priority,
            })),
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
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP Powder Coating Reports', 105, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`, 105, yPos, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 105, yPos + 5, { align: 'center' });
    
    yPos += 20;

    // Order Volume
    if (reportData.orderVolume) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Order Volume & Status', 14, yPos);
      yPos += 10;

      const statusData = Object.entries(reportData.orderVolume.statusCounts).map(([status, count]) => [
        status.replace(/-/g, ' ').toUpperCase(),
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

    // Production Pipeline
    if (reportData.productionPipeline) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Production Pipeline', 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Completed', reportData.productionPipeline.completed],
          ['Total Delayed', reportData.productionPipeline.delayed],
          ['In Progress', reportData.productionPipeline.inProgress],
        ],
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

      const memberData = Object.entries(reportData.teamAssignments.memberCounts).map(([name, count]) => [name, count]);

      autoTable(doc, {
        startY: yPos,
        head: [['Team Member', 'Orders']],
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

      autoTable(doc, {
        startY: yPos,
        head: [['Client', 'Orders']],
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

      const finishData = Object.entries(reportData.orderSpecifications.finishCounts).map(([finish, count]) => [
        finish.toUpperCase(),
        count
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Finish Type', 'Count']],
        body: finishData,
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;

      const textureData = Object.entries(reportData.orderSpecifications.textureCounts).map(([texture, count]) => [
        texture.toUpperCase(),
        count
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Texture Type', 'Count']],
        body: textureData,
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Top Colors', 'Count']],
        body: reportData.orderSpecifications.topColors,
        theme: 'grid',
      });
    }

    // Delayed Orders
    if (reportData.delayedOrders) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Delayed Orders (${reportData.delayedOrders.count})`, 14, yPos);
      yPos += 10;

      const delayedData = reportData.delayedOrders.orders.map((order: any) => [
        order.orderNumber,
        order.projectName,
        order.clientName,
        order.priority.toUpperCase(),
        order.submittedDate,
        order.estimatedCompletion,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Order #', 'Project', 'Client', 'Priority', 'Submitted', 'Est. Completion']],
        body: delayedData,
        theme: 'grid',
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 },
        },
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
      csv += 'Production Pipeline\n';
      csv += 'Metric,Value\n';
      csv += `Total Completed,${reportData.productionPipeline.completed}\n`;
      csv += `Total Delayed,${reportData.productionPipeline.delayed}\n`;
      csv += `In Progress,${reportData.productionPipeline.inProgress}\n\n`;
    }

    if (reportData.teamAssignments) {
      csv += 'Team Assignments\n';
      csv += 'Team Member,Orders\n';
      Object.entries(reportData.teamAssignments.memberCounts).forEach(([name, count]) => {
        csv += `${name},${count}\n`;
      });
      csv += '\n';
    }

    if (reportData.priorityBreakdown) {
      csv += 'Priority Breakdown\n';
      csv += 'Priority,Count\n';
      Object.entries(reportData.priorityBreakdown.priorityCounts).forEach(([priority, count]) => {
        csv += `${priority},${count}\n`;
      });
      csv += '\n';
    }

    if (reportData.clientStatistics) {
      csv += 'Client Statistics\n';
      csv += 'Client,Orders\n';
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

    if (reportData.delayedOrders) {
      csv += `Delayed Orders (${reportData.delayedOrders.count})\n`;
      csv += 'Order Number,Project Name,Client,Priority,Submitted Date,Est. Completion,Description\n';
      reportData.delayedOrders.orders.forEach((order: any) => {
        csv += `${order.orderNumber},${order.projectName},${order.clientName},${order.priority},${order.submittedDate},${order.estimatedCompletion},"${order.description}"\n`;
      });
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
                    Production Pipeline
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delayedOrders"
                    checked={selectedCategories.delayedOrders}
                    onCheckedChange={() => toggleCategory('delayedOrders')}
                  />
                  <Label htmlFor="delayedOrders" className="cursor-pointer">
                    Delayed Orders
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
                  <p className="text-sm text-muted-foreground">Total Orders: {reportData.orderVolume.total}</p>
                  <p className="text-sm text-muted-foreground">Completed: {reportData.orderVolume.completed}</p>
                </div>
              )}

              {reportData.productionPipeline && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Production Pipeline</h3>
                  <p className="text-sm text-muted-foreground">In Progress: {reportData.productionPipeline.inProgress}</p>
                  <p className="text-sm text-muted-foreground">Delayed: {reportData.productionPipeline.delayed}</p>
                </div>
              )}

              {reportData.teamAssignments && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Team Assignments</h3>
                  <p className="text-sm text-muted-foreground">Active Members: {reportData.teamAssignments.activeMembers}</p>
                </div>
              )}

              {reportData.priorityBreakdown && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Priority Breakdown</h3>
                  <p className="text-sm text-muted-foreground">Urgent Ratio: {reportData.priorityBreakdown.urgentRatio}%</p>
                </div>
              )}

              {reportData.clientStatistics && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Client Statistics</h3>
                  <p className="text-sm text-muted-foreground">Active Clients: {reportData.clientStatistics.activeClients}</p>
                  <p className="text-sm text-muted-foreground">New Clients: {reportData.clientStatistics.newClients}</p>
                </div>
              )}

              {reportData.orderSpecifications && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Specifications</h3>
                  <p className="text-sm text-muted-foreground">Total Items: {reportData.orderSpecifications.totalQuantity}</p>
                </div>
              )}

              {reportData.delayedOrders && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Delayed Orders</h3>
                  <p className="text-sm text-muted-foreground mb-3">Total Delayed: {reportData.delayedOrders.count}</p>
                  {reportData.delayedOrders.count > 0 && (
                    <div className="space-y-2">
                      {reportData.delayedOrders.orders.slice(0, 5).map((order: any, idx: number) => (
                        <div key={idx} className="p-3 border border-border rounded-md bg-card">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-sm">{order.orderNumber}</p>
                            <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                              {order.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{order.projectName}</p>
                          <p className="text-xs text-muted-foreground">Client: {order.clientName}</p>
                          <p className="text-xs text-muted-foreground">Est. Completion: {order.estimatedCompletion}</p>
                        </div>
                      ))}
                      {reportData.delayedOrders.count > 5 && (
                        <p className="text-xs text-muted-foreground">
                          + {reportData.delayedOrders.count - 5} more delayed orders (see full report)
                        </p>
                      )}
                    </div>
                  )}
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
