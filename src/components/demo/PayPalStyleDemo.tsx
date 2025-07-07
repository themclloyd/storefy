import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Search, Settings } from 'lucide-react';

export const PayPalStyleDemo = () => {
  const contacts = [
    { id: 1, name: 'Andrew Dillon', email: 'andrew.dillon@gmail.com', avatar: 'A' },
    { id: 2, name: 'Alex Millton', email: 'alexmillton@yahoo.com', avatar: 'A' },
    { id: 3, name: 'Don Norman', email: 'don@norman.net', avatar: 'D' },
    { id: 4, name: 'Jason Craig', email: 'jcraig@', avatar: 'J' },
    { id: 5, name: 'Mike Rine', email: 'mikerine@gmail.com', avatar: 'M' },
    { id: 6, name: 'Nick Aeron', email: 'aeron.nick@gmail.com', avatar: 'N' },
    { id: 7, name: 'Vena Sunny', email: '', avatar: 'V' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">PayPal-Inspired Design System</h1>
          <p className="text-muted-foreground text-lg">Clean, professional, and modern styling based on PayPal's interface</p>
        </div>

        {/* Color Palette */}
        <Card className="card-paypal">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>PayPal-inspired color scheme with professional blue and clean grays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 bg-primary rounded-lg"></div>
                <p className="text-sm font-medium">Primary Blue</p>
                <p className="text-xs text-muted-foreground">#0070BA</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-secondary border border-border rounded-lg"></div>
                <p className="text-sm font-medium">Secondary Gray</p>
                <p className="text-xs text-muted-foreground">#F5F7FA</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-success rounded-lg"></div>
                <p className="text-sm font-medium">Success Green</p>
                <p className="text-xs text-muted-foreground">#10B981</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-warning rounded-lg"></div>
                <p className="text-sm font-medium">Warning Orange</p>
                <p className="text-xs text-muted-foreground">#F59E0B</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <Card className="card-paypal">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Fully rounded buttons with PayPal-style design</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="success">Success Button</Button>
              <Button variant="warning">Warning Button</Button>
              <Button variant="destructive">Destructive Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="card-paypal">
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Rounded badges for status and categorization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="muted">Muted</Badge>
            </div>
          </CardContent>
        </Card>

        {/* PayPal-style Login Form */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="card-paypal">
            <CardHeader>
              <CardTitle>Login Form</CardTitle>
              <CardDescription>PayPal-inspired authentication interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-primary mb-2">PayPal</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Enter your name or e-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  className="input-paypal"
                  placeholder="Enter your name or e-mail"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  className="input-paypal"
                  placeholder="Password"
                />
              </div>
              
              <Button className="w-full button-paypal">Log in</Button>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Having trouble logging in?</p>
                <p className="text-sm text-primary cursor-pointer hover:underline">Sign up</p>
              </div>
            </CardContent>
          </Card>

          {/* PayPal-style Contacts */}
          <Card className="card-paypal">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Contacts</CardTitle>
              </div>
              <Button variant="ghost" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Enter a name or e-mail"
                  className="pl-10 input-paypal"
                />
              </div>
              
              <div className="space-y-1">
                {contacts.map((contact) => (
                  <div key={contact.id} className="contact-item">
                    <div className="contact-avatar">
                      {contact.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{contact.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center pt-4 border-t border-border">
                <div className="flex gap-8">
                  <Button variant="ghost" size="icon">
                    <div className="w-6 h-6 bg-muted rounded"></div>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <div className="w-6 h-6 bg-primary rounded"></div>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <div className="w-6 h-6 bg-muted rounded"></div>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Typography */}
        <Card className="card-paypal">
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Space Grotesk font family with clean hierarchy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">Heading 1</h1>
              <h2 className="text-3xl font-semibold text-foreground">Heading 2</h2>
              <h3 className="text-2xl font-medium text-foreground">Heading 3</h3>
              <h4 className="text-xl font-medium text-foreground">Heading 4</h4>
              <p className="text-base text-foreground">Body text with good readability and contrast</p>
              <p className="text-sm text-muted-foreground">Secondary text for additional information</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayPalStyleDemo;
