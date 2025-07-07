import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";

interface LaybyCalendarViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CalendarEvent {
  id: string;
  layby_id: string;
  layby_number: string;
  customer_name: string;
  event_type: 'due_date' | 'payment_schedule' | 'reminder';
  date: string;
  amount: number;
  status: string;
  priority_level?: string;
}

export function LaybyCalendarView({ open, onOpenChange }: LaybyCalendarViewProps) {
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (open && currentStore) {
      fetchCalendarEvents();
    }
  }, [open, currentStore, currentDate, viewType]);

  const fetchCalendarEvents = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      // Fetch layby due dates
      const { data: laybyOrders, error: laybyError } = await supabase
        .from('layby_orders')
        .select('*')
        .eq('store_id', currentStore.id)
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0])
        .not('due_date', 'is', null);

      if (laybyError) throw laybyError;

      // Fetch payment schedule events
      const { data: paymentSchedules, error: scheduleError } = await supabase
        .from('layby_payment_schedules')
        .select(`
          *,
          layby_orders!inner (
            id,
            layby_number,
            customer_name,
            store_id,
            status,
            priority_level
          )
        `)
        .eq('layby_orders.store_id', currentStore.id)
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0]);

      if (scheduleError) throw scheduleError;

      const calendarEvents: CalendarEvent[] = [];

      // Add layby due dates
      laybyOrders?.forEach(layby => {
        if (layby.due_date) {
          calendarEvents.push({
            id: `due_${layby.id}`,
            layby_id: layby.id,
            layby_number: layby.layby_number,
            customer_name: layby.customer_name,
            event_type: 'due_date',
            date: layby.due_date,
            amount: layby.balance_remaining,
            status: layby.status,
            priority_level: layby.priority_level
          });
        }
      });

      // Add payment schedule events
      paymentSchedules?.forEach(schedule => {
        calendarEvents.push({
          id: `schedule_${schedule.id}`,
          layby_id: schedule.layby_order_id,
          layby_number: schedule.layby_orders.layby_number,
          customer_name: schedule.layby_orders.customer_name,
          event_type: 'payment_schedule',
          date: schedule.due_date,
          amount: schedule.amount_due - schedule.amount_paid,
          status: schedule.status,
          priority_level: schedule.layby_orders.priority_level
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    if (viewType === 'month') {
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      return startOfWeek;
    }
  };

  const getViewEndDate = () => {
    if (viewType === 'month') {
      return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    } else {
      const endOfWeek = new Date(currentDate);
      endOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6);
      return endOfWeek;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = event.date;
      const matchesDate = eventDate === dateStr;
      const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
      return matchesDate && matchesFilter;
    });
  };

  const exportCalendar = () => {
    const filteredEvents = events.filter(event => 
      filterStatus === 'all' || event.status === filterStatus
    );

    const csvData = filteredEvents.map(event => ({
      'Date': event.date,
      'Layby Number': event.layby_number,
      'Customer': event.customer_name,
      'Event Type': event.event_type.replace('_', ' '),
      'Amount': event.amount.toFixed(2),
      'Status': event.status,
      'Priority': event.priority_level || 'normal'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layby-calendar-${currentDate.toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderCalendarGrid = () => {
    const startDate = getViewStartDate();
    const endDate = getViewEndDate();
    const days = [];
    
    if (viewType === 'month') {
      // Start from the first day of the week containing the first day of the month
      const firstDayOfWeek = new Date(startDate);
      firstDayOfWeek.setDate(startDate.getDate() - startDate.getDay());
      
      for (let d = new Date(firstDayOfWeek); d <= endDate || days.length < 42; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
    } else {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
    }

    return (
      <div className={`grid gap-1 ${viewType === 'month' ? 'grid-cols-7' : 'grid-cols-7'}`}>
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-[100px] p-1 border border-border ${
                !isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''
              } ${isToday ? 'bg-primary/10 border-primary' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate ${
                      event.event_type === 'due_date'
                        ? event.status === 'overdue'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                        : event.status === 'overdue'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                    }`}
                    title={`${event.layby_number} - ${event.customer_name} - $${event.amount.toFixed(2)}`}
                  >
                    {event.layby_number}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Layby Calendar - Payment Schedule & Due Dates
          </DialogTitle>
          <DialogDescription>
            View layby due dates and payment schedules in a calendar format with filtering and export options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Calendar Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-medium min-w-[200px] text-center">
                {viewType === 'month' 
                  ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : `Week of ${getViewStartDate().toLocaleDateString()}`
                }
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Select value={viewType} onValueChange={(value: 'month' | 'week') => setViewType(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportCalendar}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary/10 border border-primary/20 rounded"></div>
              <span>Due Dates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success/10 border border-success/20 rounded"></div>
              <span>Payment Schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive/10 border border-destructive/20 rounded"></div>
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-warning/10 border border-warning/20 rounded"></div>
              <span>Payment Overdue</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading calendar...</p>
                  </div>
                </div>
              ) : (
                renderCalendarGrid()
              )}
            </CardContent>
          </Card>

          {/* Event Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Events Summary - {events.filter(e => filterStatus === 'all' || e.status === filterStatus).length} events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Due Dates:</span>
                  <div className="font-medium">
                    {events.filter(e => e.event_type === 'due_date' && (filterStatus === 'all' || e.status === filterStatus)).length}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Schedule:</span>
                  <div className="font-medium">
                    {events.filter(e => e.event_type === 'payment_schedule' && (filterStatus === 'all' || e.status === filterStatus)).length}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Overdue:</span>
                  <div className="font-medium text-red-600">
                    {events.filter(e => e.status === 'overdue' && (filterStatus === 'all' || filterStatus === 'overdue')).length}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Amount:</span>
                  <div className="font-medium">
                    ${events.filter(e => filterStatus === 'all' || e.status === filterStatus)
                      .reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
