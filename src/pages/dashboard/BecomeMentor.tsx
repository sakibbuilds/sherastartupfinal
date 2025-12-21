import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Note: mentor_applications table needs to be created via migration
// This page is currently a placeholder
const BecomeMentor = () => {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Become a Mentor</CardTitle>
          <CardDescription>
            Share your expertise and guide the next generation of founders.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          <p>Mentor applications require the mentor_applications table to be created.</p>
          <p className="text-sm mt-2">Please run the database migration to enable this feature.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BecomeMentor;
