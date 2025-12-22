import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

// Note: This feature requires the 'advertisements' table to be created via database migration
const AdminAdvertisements = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Manage Advertisements</h1>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Feature Not Available
          </CardTitle>
          <CardDescription>
            The advertisements feature requires database setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            To enable this feature, the <code className="bg-muted px-1 py-0.5 rounded">advertisements</code> table 
            needs to be created in your database. Please run the required migration to enable advertisement management.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAdvertisements;