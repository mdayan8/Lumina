import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, AlertCircle, CheckCircle, BarChart, MessageCircle, Database, Eye, Lightbulb, Sheet } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { GoogleSheetsForm } from '@/components/ui/google-sheets-form';
import { DatabaseForm } from '@/components/ui/database-form';

interface FileUploadProps {
  onFileUploaded: (file: any, summaryMessage?: any) => void;
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem("authToken");

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
        throw new Error('Failed to upload file');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File uploaded successfully!",
        description: `Your dataset has ${data.schema.columns.length} columns and ${data.schema.totalRows} rows.`,
      });

      // Create a welcome message for the chat
      const welcomeMessage = {
        id: 'welcome',
        type: 'ai',
        content: "Hi! Your data has been loaded successfully.",
        explanation: "I've scanned your file to understand its structure, including column names and data types, to prepare for your analysis questions.",
        method: "Data Profiling",
        confidence: 98,
        dataPoints: data.schema.totalRows,
        timestamp: new Date(),
      };

      // Add data preview information to the message
      const previewData = {
        ...welcomeMessage,
        preview: {
          columns: data.schema.columns,
          rowCount: data.schema.totalRows,
          sampleRows: data.schema.previewData || []
        }
      };

      onFileUploaded(data.file, previewData);
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
    <Card className="upload-zone">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold mb-2">Connect Your Data</h3>
          <p className="text-muted-foreground">Choose how you'd like to import your data</p>
        </div>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="file">
              <Upload className="w-4 h-4 mr-2" />
              File Upload
            </TabsTrigger>
            <TabsTrigger value="sheets">
              <Sheet className="w-4 h-4 mr-2" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="w-4 h-4 mr-2" />
              Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div
              {...getRootProps()}
              data-testid="file-upload-zone"
              className={`border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer ${isDragActive || isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
            >
              <input {...getInputProps()} data-testid="file-input" />

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                  {isUploading ? (
                    <div className="animate-spin">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                  ) : uploadMutation.isSuccess ? (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  ) : uploadMutation.isError ? (
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  ) : (
                    <Upload className="w-8 h-8 text-primary" />
                  )}
                </div>

                <h4 className="text-lg font-semibold mb-2">
                  {isUploading ? 'Processing Your Data...' : 'Drop files here'}
                </h4>

                <p className="text-sm text-muted-foreground mb-4">
                  {isUploading ? (
                    'Analyzing file structure and preparing for insights...'
                  ) : (
                    <>
                      Drag and drop your Excel or CSV files, or click to browse
                      <br />
                      <span className="text-xs">Supported: .xlsx, .xls, .csv (up to 50MB)</span>
                    </>
                  )}
                </p>

                {isUploading && (
                  <div className="mb-4">
                    <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                  </div>
                )}

                {!isUploading && (
                  <Button className="gradient-button" data-testid="button-upload">
                    <FileText className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                )}
              </div>
            </div>

            {/* Enhanced Feature Highlights */}
            {!isUploading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center p-3 bg-primary/5 rounded-lg">
                  <BarChart className="w-5 h-5 text-primary mr-2" />
                  <span className="text-sm">Charts & Graphs</span>
                </div>
                <div className="flex items-center p-3 bg-primary/5 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-primary mr-2" />
                  <span className="text-sm">Chat Interface</span>
                </div>
                <div className="flex items-center p-3 bg-primary/5 rounded-lg">
                  <Database className="w-5 h-5 text-primary mr-2" />
                  <span className="text-sm">Smart Insights</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sheets">
            <GoogleSheetsForm onFileUploaded={onFileUploaded} />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseForm onFileUploaded={onFileUploaded} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}