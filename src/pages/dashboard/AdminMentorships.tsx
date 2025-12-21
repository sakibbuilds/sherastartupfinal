import { Card, CardContent } from '@/components/ui/card';

// Note: mentor_applications table needs to be created via migration
// This page is currently a placeholder
const AdminMentorships = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mentorship Applications</h1>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Mentorship management requires the mentor_applications table to be created.</p>
          <p className="text-sm mt-2">Please run the database migration to enable this feature.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMentorships;
