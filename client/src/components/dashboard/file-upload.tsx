import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, Play, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function FileUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: uploads } = useQuery({
    queryKey: ["/api/uploads"],
    refetchInterval: 2000, // Poll for status updates
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const processAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/process-all', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Process all failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "Success",
        description: data.message || "Processing initiated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process files",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadMutation.mutate(file);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Upload & Processing</CardTitle>
          <Button 
            size="sm" 
            onClick={() => processAllMutation.mutate()}
            disabled={processAllMutation.isPending}
          >
            <Play className="w-4 h-4 mr-2" />
            {processAllMutation.isPending ? "Processing..." : "Process All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? "border-blue-400 bg-blue-50" 
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudUpload className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? "Drop files here" : "Drop your sales data files here"}
          </h4>
          <p className="text-gray-500 mb-4">Support for CSV, Excel files up to 50MB</p>
          <Button disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Uploading..." : "Select Files"}
          </Button>
        </div>

        {uploads && uploads.length > 0 && (
          <div className="mt-6 space-y-3">
            <h5 className="font-medium text-gray-900">File Processing Status</h5>
            {uploads.slice(0, 5).map((upload: any) => (
              <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{upload.originalName}</p>
                    <p className="text-sm text-gray-500">
                      {(upload.fileSize / (1024 * 1024)).toFixed(1)} MB • {upload.status}
                      {upload.status === 'processing' && ` (${upload.rowsProcessed}/${upload.totalRows} rows)`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {upload.status === 'processing' && (
                    <>
                      <div className="w-32">
                        <Progress value={upload.progress} />
                      </div>
                      <span className="text-sm font-medium text-blue-600">{upload.progress}%</span>
                    </>
                  )}
                  {upload.status === 'completed' && (
                    <span className="text-sm font-medium text-green-600">Complete</span>
                  )}
                  {upload.status === 'failed' && (
                    <span className="text-sm font-medium text-red-600">Failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
