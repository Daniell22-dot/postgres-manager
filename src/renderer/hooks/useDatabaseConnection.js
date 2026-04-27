import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

export const useDatabaseConnection = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [results, setResults] = useState(null);
  const abortControllerRef = useRef(null);

  const executeQuery = useCallback(async (connectionId, database, sql, params = []) => {
    // Cancel any ongoing query
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsExecuting(true);
    setCurrentQuery(sql);
    
    const startTime = performance.now();
    
    try {
      const result = await window.electronAPI.executeQuery(connectionId, database, sql, params);
      const endTime = performance.now();
      
      if (result.success) {
        const duration = result.duration || (endTime - startTime);
        const rowCount = result.rowCount ?? 0;
        const command = result.command || '';
        
        setResults({
          rows: result.rows || [],
          rowCount: rowCount,
          fields: result.fields || [],
          duration: duration,
          command: command
        });
        
        // Show appropriate message based on command type
        const durationStr = `${(duration / 1000).toFixed(2)}s`;
        if (command === 'SELECT') {
          toast.success(`Query returned ${rowCount.toLocaleString()} rows in ${durationStr}`);
        } else if (command === 'INSERT') {
          toast.success(`${rowCount} row(s) inserted in ${durationStr}`);
        } else if (command === 'UPDATE') {
          toast.success(`${rowCount} row(s) updated in ${durationStr}`);
        } else if (command === 'DELETE') {
          toast.success(`${rowCount} row(s) deleted in ${durationStr}`);
        } else if (command) {
          toast.success(`${command} executed successfully in ${durationStr}`);
        } else {
          toast.success(`Query executed successfully in ${durationStr}`);
        }
        return result;
      } else {
        toast.error(`Query failed: ${result.error}`);
        setResults({
          error: result.error,
          duration: result.duration || (endTime - startTime)
        });
        return result;
      }
    } catch (error) {
      toast.error(`Execution error: ${error.message}`);
      setResults({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      setIsExecuting(false);
      setCurrentQuery(null);
      abortControllerRef.current = null;
    }
  }, []);

  const cancelQuery = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      toast.info('Query cancelled');
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  return {
    executeQuery,
    cancelQuery,
    clearResults,
    isExecuting,
    currentQuery,
    results
  };
};