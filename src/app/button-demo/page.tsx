'use client';
import Button from '../ui/Button';

export default function ButtonDemo() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Button component demo</h1>
      <div className="flex gap-4 items-center">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button href="/" variant="ghost">
          Link to Home
        </Button>
        <Button variant="primary" loading>
          Loading
        </Button>
        <Button variant="primary" icon={<span>🔥</span>} iconPosition="right">
          With Icon
        </Button>
      </div>
    </main>
  );
}
