'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface BrowseStudentsCardProps {
  completionPercentage: number
}

export default function BrowseStudentsCard({ completionPercentage }: BrowseStudentsCardProps) {
  const isDisabled = completionPercentage < 100

  return (
    <Card 
      className={cn(
        'h-full p-6 flex flex-col justify-between',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
      data-testid="browse-students-card"
    >
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <Search className="h-8 w-8 text-gray-600" />
          <h3 className="text-xl font-medium">Browse Students</h3>
        </div>
        <p className="text-gray-600 mb-4">
          {isDisabled
            ? 'Complete your profile to browse available students'
            : 'Find other students with complementary skills'}
        </p>
      </div>
      <Link href="/student-dashboard/browse">
        <Button
          variant="primary"
          className="w-full mt-2"
          disabled={isDisabled}
        >
          Browse Students
        </Button>
      </Link>
    </Card>
  )
} 