import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUploaded: (file: any) => void;
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest('POST', '/api/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File uploaded successfully!",
        description: `Processed ${data.schema.totalRows} rows with ${data.schema.columns.length} columns.`,
      });
      onFileUploaded(data.file);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
      setUploadProgress(0);
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadProgress(25);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
  });

  const isUploading = uploadMutation.isPending;

  return (
    <Card className={`upload-zone cursor-pointer transition-all ${isDragActive || isDragOver ? 'drag-over' : ''}`}>
      <CardContent className="p-12">
        <div {...getRootProps()} data-testid="file-upload-zone">
          <input {...getInputProps()} data-testid="file-input" />
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
              ) : uploadMutation.isSuccess ? (
                <CheckCircle className="w-10 h-10 text-green-500" />
              ) : uploadMutation.isError ? (
                <AlertCircle className="w-10 h-10 text-destructive" />
              ) : (
                <Upload className="w-10 h-10 text-primary" />
              )}
            </div>
            
            <h3 className="text-2xl font-semibold mb-4">
              {isUploading ? 'Processing Your Data...' : 'Upload Your Data'}
            </h3>
            
            <p className="text-muted-foreground mb-6">
              {isUploading ? (
                'Analyzing file structure and preparing for insights...'
              ) : (
                <>
                  Drag and drop your Excel or CSV files here, or click to browse.
                  <br />
                  Supported formats: .xlsx, .xls, .csv (up to 50MB)
                </>
              )}
            </p>

            {isUploading && (
              <div className="mb-6">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  Processing file...
                </p>
              </div>
            )}

            {!isUploading && (
              <Button className="gradient-button pulse-glow" data-testid="button-upload">
                <FileText className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
