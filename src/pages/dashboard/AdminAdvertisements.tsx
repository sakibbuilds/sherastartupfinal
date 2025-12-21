import { Card, CardContent } from '@/components/ui/card';

// Note: advertisements table needs to be created via migration
// This page is currently a placeholder
const AdminAdvertisements = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Manage Advertisements</h1>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Advertisement management requires the advertisements table to be created.</p>
          <p className="text-sm mt-2">Please run the database migration to enable this feature.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAdvertisements;
