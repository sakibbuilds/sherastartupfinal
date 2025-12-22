import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

// Note: This feature requires the 'mentor_applications' table to be created via database migration
const AdminMentorships = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mentorship Applications</h1>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Feature Not Available
          </CardTitle>
          <CardDescription>
            The mentorship applications feature requires database setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            To enable this feature, the <code className="bg-muted px-1 py-0.5 rounded">mentor_applications</code> table 
            needs to be created in your database. Please run the required migration to enable mentor application reviews.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMentorships;