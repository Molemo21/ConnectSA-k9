'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Provider, User } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type ProviderWithUser = Omit<Provider, 'status'> & { status: string; user: User };

export default function ProviderList() {
  const [providers, setProviders] = useState<ProviderWithUser[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/admin/providers');
        if (!res.ok) {
          console.error('Failed to fetch providers:', res.status);
          setError(`Failed to fetch providers: ${res.status}`);
          setProviders([]);
          return;
        }
        const data = await res.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setProviders(data);
        } else {
          console.error('Providers data is not an array:', data);
          setError('Invalid data format received');
          setProviders([]);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        setError('Failed to fetch providers');
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProviders();
  }, []);

  const openModal = (provider: ProviderWithUser) => {
    setSelectedProvider(provider);
    setComment('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProvider(null);
    setComment('');
    setModalOpen(false);
  };

  const handleStatusChange = async (id: string, status: string, comment: string) => {
    setActionLoading(true);
    await fetch(`/api/admin/providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment }),
    });
    setProviders(
      providers.map((p) => (p.id === id ? { ...p, status } : p))
    );
    setActionLoading(false);
    closeModal();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading providers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600">No providers found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell>{provider.user.name}</TableCell>
              <TableCell>{provider.user.email}</TableCell>
              <TableCell>
                <Badge>{provider.status}</Badge>
              </TableCell>
              <TableCell>
                <Button onClick={() => openModal(provider)}>
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provider Details</DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-4">
              <div>
                <strong>Business Name:</strong> {selectedProvider.businessName || 'N/A'}
              </div>
              <div>
                <strong>Description:</strong> {selectedProvider.description || 'N/A'}
              </div>
              <div>
                <strong>Experience:</strong> {selectedProvider.experience || 'N/A'} years
              </div>
              <div>
                <strong>Hourly Rate:</strong> {selectedProvider.hourlyRate ? `R${selectedProvider.hourlyRate}` : 'N/A'}
              </div>
              <div>
                <strong>Location:</strong> {selectedProvider.location || 'N/A'}
              </div>
              <div>
                <strong>ID Document:</strong>{' '}
                {selectedProvider.idDocument ? (
                  <>
                    <a href={selectedProvider.idDocument} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mr-2">Download</a>
                    <img src={selectedProvider.idDocument} alt="ID Document" className="max-h-32 mt-2" />
                  </>
                ) : 'N/A'}
              </div>
              <div>
                <strong>Proof of Address:</strong>{' '}
                {selectedProvider.proofOfAddress ? (
                  <>
                    <a href={selectedProvider.proofOfAddress} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mr-2">Download</a>
                    <img src={selectedProvider.proofOfAddress} alt="Proof of Address" className="max-h-32 mt-2" />
                  </>
                ) : 'N/A'}
              </div>
              <div>
                <strong>Certifications:</strong>{' '}
                {selectedProvider.certifications && selectedProvider.certifications.length > 0 ? (
                  <ul className="list-disc ml-6">
                    {selectedProvider.certifications.map((cert, idx) => (
                      <li key={idx}>
                        <a href={cert} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mr-2">Download</a>
                        <img src={cert} alt={`Certification ${idx + 1}`} className="max-h-32 mt-2" />
                      </li>
                    ))}
                  </ul>
                ) : 'N/A'}
              </div>
              <div>
                <strong>Profile Images:</strong>{' '}
                {selectedProvider.profileImages && selectedProvider.profileImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProvider.profileImages.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt={`Profile ${idx + 1}`} className="max-h-24 rounded" />
                      </a>
                    ))}
                  </div>
                ) : 'N/A'}
              </div>
              <div>
                <Textarea
                  placeholder="Add a comment (required for approval/rejection)"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
              <DialogFooter className="flex gap-2 justify-end">
                {selectedProvider.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange(selectedProvider.id, 'APPROVED', comment)}
                      disabled={actionLoading || !comment.trim()}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(selectedProvider.id, 'REJECTED', comment)}
                      variant="destructive"
                      disabled={actionLoading || !comment.trim()}
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={closeModal} disabled={actionLoading}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
