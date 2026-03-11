import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Film, Upload, Eye, Trash2, MoreHorizontal, Star, Play, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Movies() {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [movieData, setMovieData] = useState({
    title: '',
    description: '',
    genre: 'action',
    release_year: new Date().getFullYear(),
    duration_minutes: '',
    director: '',
    cast: '',
    rating: 'NR',
    status: 'draft',
    is_featured: false,
  });

  const queryClient = useQueryClient();

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => base44.entities.Movie.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Movie.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('Movie added successfully');
      setShowAddDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Movie.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('Movie updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Movie.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('Movie deleted');
    },
  });

  const resetForm = () => {
    setMovieData({
      title: '',
      description: '',
      genre: 'action',
      release_year: new Date().getFullYear(),
      duration_minutes: '',
      director: '',
      cast: '',
      rating: 'NR',
      status: 'draft',
      is_featured: false,
    });
  };

  const handleFileUpload = async (file, type) => {
    setIsUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      toast.success(`${type} uploaded successfully`);
      return result.file_url;
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await handleFileUpload(file, 'Video');
      if (url) {
        setMovieData({ ...movieData, video_url: url });
      }
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await handleFileUpload(file, 'Thumbnail');
      if (url) {
        setMovieData({ ...movieData, thumbnail_url: url });
      }
    }
  };

  const handleTrailerUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await handleFileUpload(file, 'Trailer');
      if (url) {
        setMovieData({ ...movieData, trailer_url: url });
      }
    }
  };

  const handleSubmit = () => {
    if (!movieData.title) {
      toast.error('Please enter a movie title');
      return;
    }
    
    const dataToSubmit = {
      ...movieData,
      duration_minutes: Number(movieData.duration_minutes) || 0,
      release_year: Number(movieData.release_year),
      cast: movieData.cast ? movieData.cast.split(',').map(s => s.trim()) : [],
    };

    createMutation.mutate(dataToSubmit);
  };

  const filteredMovies = movies.filter((m) => {
    const matchesSearch = m.title?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Movie',
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.thumbnail_url ? (
            <img src={row.thumbnail_url} alt={row.title} className="w-16 h-24 object-cover rounded" />
          ) : (
            <div className="w-16 h-24 bg-slate-200 rounded flex items-center justify-center">
              <Film className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900">{row.title}</p>
            <p className="text-sm text-slate-500 capitalize">{row.genre}</p>
            {row.is_featured && (
              <div className="flex items-center gap-1 text-amber-600 mt-1">
                <Star className="w-3 h-3 fill-amber-600" />
                <span className="text-xs">Featured</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Details',
      cell: (row) => (
        <div className="text-sm">
          <p className="text-slate-900">{row.release_year}</p>
          <p className="text-slate-500">{row.duration_minutes ? `${row.duration_minutes} min` : '-'}</p>
          <p className="text-slate-500">{row.rating}</p>
        </div>
      ),
    },
    {
      header: 'Director',
      cell: (row) => (
        <span className="text-sm text-slate-600">{row.director || '-'}</span>
      ),
    },
    {
      header: 'Views',
      cell: (row) => (
        <div className="flex items-center gap-1 text-slate-600">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">{row.views || 0}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Added',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {format(new Date(row.created_date), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: '',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedMovie(row); setShowDetailsDialog(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            {row.status === 'draft' && (
              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: row.id, data: { status: 'published' } })}>
                <Play className="w-4 h-4 mr-2" /> Publish
              </DropdownMenuItem>
            )}
            {row.status === 'published' && (
              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: row.id, data: { status: 'archived' } })}>
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => updateMutation.mutate({ id: row.id, data: { is_featured: !row.is_featured } })}
            >
              <Star className="w-4 h-4 mr-2" /> 
              {row.is_featured ? 'Unfeature' : 'Feature'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteMutation.mutate(row.id)} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Velo Ultra Movies</h2>
          <p className="text-slate-500">Manage your movie library</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-violet-600 to-purple-600">
          <Upload className="w-4 h-4 mr-2" />
          Upload Movie
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-0 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{movies.length}</p>
          <p className="text-sm text-slate-500">Total Movies</p>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">
            {movies.filter(m => m.status === 'published').length}
          </p>
          <p className="text-sm text-slate-500">Published</p>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <p className="text-2xl font-bold text-amber-600">
            {movies.filter(m => m.is_featured).length}
          </p>
          <p className="text-sm text-slate-500">Featured</p>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">
            {movies.reduce((sum, m) => sum + (m.views || 0), 0)}
          </p>
          <p className="text-sm text-slate-500">Total Views</p>
        </Card>
      </div>

      <Card className="p-6 bg-white border-0 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredMovies}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search movies..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={statusOptions}
          filterPlaceholder="Filter by status"
          emptyMessage="No movies found"
        />
      </Card>

      {/* Add Movie Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload New Movie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={movieData.title}
                  onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
                  placeholder="Movie title"
                />
              </div>
              <div>
                <Label>Genre</Label>
                <Select value={movieData.genre} onValueChange={(v) => setMovieData({ ...movieData, genre: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="comedy">Comedy</SelectItem>
                    <SelectItem value="drama">Drama</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="thriller">Thriller</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="animation">Animation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={movieData.description}
                onChange={(e) => setMovieData({ ...movieData, description: e.target.value })}
                placeholder="Movie description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Release Year</Label>
                <Input
                  type="number"
                  value={movieData.release_year}
                  onChange={(e) => setMovieData({ ...movieData, release_year: e.target.value })}
                />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={movieData.duration_minutes}
                  onChange={(e) => setMovieData({ ...movieData, duration_minutes: e.target.value })}
                />
              </div>
              <div>
                <Label>Rating</Label>
                <Select value={movieData.rating} onValueChange={(v) => setMovieData({ ...movieData, rating: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">G</SelectItem>
                    <SelectItem value="PG">PG</SelectItem>
                    <SelectItem value="PG-13">PG-13</SelectItem>
                    <SelectItem value="R">R</SelectItem>
                    <SelectItem value="NC-17">NC-17</SelectItem>
                    <SelectItem value="NR">Not Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Director</Label>
                <Input
                  value={movieData.director}
                  onChange={(e) => setMovieData({ ...movieData, director: e.target.value })}
                  placeholder="Director name"
                />
              </div>
              <div>
                <Label>Cast (comma-separated)</Label>
                <Input
                  value={movieData.cast}
                  onChange={(e) => setMovieData({ ...movieData, cast: e.target.value })}
                  placeholder="Actor 1, Actor 2..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Movie File</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isUploading}
                />
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {movieData.video_url && (
                <p className="text-xs text-emerald-600">✓ Video uploaded</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Thumbnail/Poster</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={isUploading}
              />
              {movieData.thumbnail_url && (
                <p className="text-xs text-emerald-600">✓ Thumbnail uploaded</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Trailer (optional)</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={handleTrailerUpload}
                disabled={isUploading}
              />
              {movieData.trailer_url && (
                <p className="text-xs text-emerald-600">✓ Trailer uploaded</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || isUploading}>
              Add Movie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movie Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Movie Details</DialogTitle>
          </DialogHeader>
          {selectedMovie && (
            <div className="space-y-4">
              {selectedMovie.thumbnail_url && (
                <img src={selectedMovie.thumbnail_url} alt={selectedMovie.title} className="w-full h-64 object-cover rounded-lg" />
              )}
              <div>
                <h3 className="text-2xl font-bold">{selectedMovie.title}</h3>
                <p className="text-slate-500 capitalize">{selectedMovie.genre} • {selectedMovie.release_year} • {selectedMovie.rating}</p>
              </div>
              {selectedMovie.description && (
                <p className="text-slate-700">{selectedMovie.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Director</p>
                  <p className="font-medium">{selectedMovie.director || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="font-medium">{selectedMovie.duration_minutes ? `${selectedMovie.duration_minutes} minutes` : '-'}</p>
                </div>
              </div>
              {selectedMovie.cast?.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Cast</p>
                  <p className="text-sm">{selectedMovie.cast.join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}