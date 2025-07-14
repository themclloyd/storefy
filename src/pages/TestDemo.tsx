import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  User,
  Plus,
  SortDesc,
  Calendar,
  MapPin,
  Mail,
  MoreHorizontal,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";

const TestDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for the dashboard
  const newCustomersData = [
    { day: 'Mon', value: 8 },
    { day: 'Tue', value: 12 },
    { day: 'Wed', value: 10 },
    { day: 'Thu', value: 6 },
    { day: 'Fri', value: 15 }
  ];

  const dealStages = [
    {
      title: "Contacted",
      count: 12,
      deals: [
        {
          name: "ByteBridge",
          description: "Corporate and personal data protection on a turnkey basis",
          date: "18 Apr",
          comments: 2,
          tasks: 1
        },
        {
          name: "AI Synergy",
          description: "Innovative solutions based on artificial intelligence",
          date: "21 Mar",
          comments: 1,
          tasks: 3
        },
        {
          name: "LeadBoost Agency",
          description: "Lead attraction and automation for small business...",
          date: "No due date",
          comments: 4,
          tasks: 7
        }
      ]
    },
    {
      title: "Negotiation",
      count: 17,
      deals: [
        {
          name: "SkillUp Hub",
          description: "Platform for professional development of specialists",
          date: "09 Mar",
          comments: 4,
          tasks: 1
        },
        {
          name: "Thera Well",
          description: "Platform for psychological support and consultations",
          date: "No due date",
          comments: 7,
          tasks: 2
        },
        {
          name: "SwiftCargo",
          description: "International transportation of chemical goods",
          date: "23 Apr",
          comments: 2,
          tasks: 5
        }
      ]
    },
    {
      title: "Offer Sent",
      count: 13,
      deals: [
        {
          name: "FitLife Nutrition",
          description: "Nutritious food and nutraceuticals for individuals",
          date: "10 Mar",
          comments: 1,
          tasks: 3
        },
        {
          name: "Prime Estate",
          description: "Agency-developer of low-rise and commercial real estate",
          date: "14 Apr",
          contact: "Antony Cardenas",
          location: "540 Realty Blvd, Miami, FL 33132",
          email: "contact@primeestate.com",
          comments: 1,
          tasks: 1
        },
        {
          name: "NextGen University",
          description: "",
          date: "",
          comments: 0,
          tasks: 0
        }
      ]
    },
    {
      title: "Deal Closed",
      count: 12,
      deals: [
        {
          name: "CloudSphere",
          description: "Cloud services for data storage and processing for lo...",
          date: "24 Mar",
          comments: 2,
          tasks: 1
        },
        {
          name: "Advantage Medi",
          description: "Full cycle of digital advertising and social media promotion",
          date: "08 Apr",
          comments: 1,
          tasks: 3
        },
        {
          name: "Safebank Solutions",
          description: "Innovative financial technologies and digital pay...",
          date: "30 Mar",
          comments: 4,
          tasks: 7
        }
      ]
    }
  ];

  const teamMembers = [
    { name: "Sandra Perry", role: "Team Manager", avatar: "SP" },
    { name: "Antony Cardenas", role: "Sales Rep", avatar: "AC" },
    { name: "Jamal Connolly", role: "Team Manager", avatar: "JC" },
    { name: "Cara Carr", role: "SEO Specialist", avatar: "CC" },
    { name: "Iona Rollins", role: "", avatar: "IR" }
  ];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">BizLink</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <SortDesc className="w-4 h-4 mr-2" />
              Sort by
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-2" />
              Me
            </Button>
            <Button className="bg-black text-white hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              Add customer
            </Button>
          </div>
        </div>

        {/* Sidebar and Main Content */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg p-4 h-fit">
            {/* Navigation */}
            <div className="mb-6">
              <nav className="space-y-2">
                <a href="#" className="flex items-center space-x-3 text-gray-900 bg-gray-100 rounded-lg px-3 py-2">
                  <span>📊</span>
                  <span>Dashboard</span>
                </a>
                <a href="#" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-100 rounded-lg px-3 py-2">
                  <span>📋</span>
                  <span>Tasks</span>
                  <Badge variant="secondary" className="ml-auto">2</Badge>
                </a>
                <a href="#" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-100 rounded-lg px-3 py-2">
                  <span>📈</span>
                  <span>Activity</span>
                </a>
                <a href="#" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-100 rounded-lg px-3 py-2">
                  <span>👥</span>
                  <span>Customers</span>
                </a>
                <a href="#" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-100 rounded-lg px-3 py-2">
                  <span>⚙️</span>
                  <span>Settings</span>
                </a>
              </nav>
            </div>

            {/* Projects */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Projects</h3>
              <div className="space-y-2">
                <a href="#" className="flex items-center space-x-3 text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2">
                  <span>💼</span>
                  <span>BizConnect</span>
                  <Badge variant="secondary" className="ml-auto">7</Badge>
                </a>
                <a href="#" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-100 rounded-lg px-3 py-2">
                  <span>📈</span>
                  <span>Growth Hub</span>
                </a>
                <a href="#" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-100 rounded-lg px-3 py-2">
                  <span>🔄</span>
                  <span>Conversion Path</span>
                </a>
                <a href="#" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-100 rounded-lg px-3 py-2">
                  <span>📊</span>
                  <span>Marketing</span>
                </a>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500">Members</h3>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                      <p className="text-xs text-gray-500 truncate">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* New Customers Chart */}
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">New customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end space-x-1 h-20 mb-4">
                    {newCustomersData.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gray-800 rounded-sm mb-1"
                          style={{ height: `${(item.value / 15) * 60}px` }}
                        />
                        <span className="text-xs text-gray-500">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate */}
              <Card className="col-span-1">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${68 * 2.51} ${100 * 2.51}`}
                          className="text-gray-800"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">68%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">Successful deals</p>
                </CardContent>
              </Card>

              {/* Revenue Stats */}
              <Card className="col-span-1">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">53</div>
                    <div className="text-2xl font-bold mb-4">$15,890</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Tasks in progress</span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Prepayments from customers</span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deal Pipeline */}
            <div className="grid grid-cols-4 gap-4">
              {dealStages.map((stage, stageIndex) => (
                <div key={stageIndex} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{stage.title}</h3>
                    <Badge variant="secondary">{stage.count}</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {stage.deals.map((deal, dealIndex) => (
                      <Card key={dealIndex} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{deal.name}</h4>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {deal.description && (
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{deal.description}</p>
                        )}
                        
                        {deal.contact && (
                          <div className="space-y-1 mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs">AC</span>
                              </div>
                              <span className="text-xs text-gray-600">{deal.contact}</span>
                            </div>
                            {deal.location && (
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span>{deal.location}</span>
                              </div>
                            )}
                            {deal.email && (
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Mail className="w-3 h-3" />
                                <span>{deal.email}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-2">
                            {deal.date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{deal.date}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            {deal.comments > 0 && (
                              <span>💬 {deal.comments}</span>
                            )}
                            {deal.tasks > 0 && (
                              <span>📋 {deal.tasks}</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDemo;
