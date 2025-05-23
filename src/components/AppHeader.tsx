
import type { FC } from 'react';
import { Stethoscope } from 'lucide-react';

const AppHeader: FC = () => {
  return (
    <header className="py-4 shadow-md bg-card">
      <div className="container mx-auto flex items-center justify-center">
        <Stethoscope className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold text-primary">
          症狀偵探
        </h1>
      </div>
    </header>
  );
};

export default AppHeader;
