// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
import { ToolbarService } from '@ohif/core';
import type { Button } from '@ohif/core/types';

const { createButton } = ToolbarService;

export const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
  },
};

const toolbarButtons: Button[] = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementTools',
      // group evaluate to determine which item should move to the top
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
      primary: createButton({
        id: 'Length',
        icon: 'tool-length',
        label: 'Length',
        tooltip: 'Length Tool',
        commands: setToolActiveToolbar,
        evaluate: 'evaluate.cornerstoneTool',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'More Measure Tools',
      },
      items: [
        createButton({
          id: 'Length',
          icon: 'tool-length',
          label: 'Length',
          tooltip: 'Length Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'Bidirectional',
          icon: 'tool-bidirectional',
          label: 'Bidirectional',
          tooltip: 'Bidirectional Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'ArrowAnnotate',
          icon: 'tool-annotate',
          label: 'Annotation',
          tooltip: 'Arrow Annotate',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'CTR',
          icon: 'icon-ctr',
          label: 'CTR',
          tooltip: 'CTR Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'EllipticalROI',
          icon: 'tool-ellipse',
          label: 'Ellipse',
          tooltip: 'Ellipse ROI',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'RectangleROI',
          icon: 'tool-rectangle',
          label: 'Rectangle',
          tooltip: 'Rectangle',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'SpineLabeling',
          icon: 'icon-spine-labeling',
          label: 'Spine Labeling',
          tooltip: 'Spine Labeling Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'CircleROI',
          icon: 'tool-circle',
          label: 'Circle',
          tooltip: 'Circle Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'PlanarFreehandROI',
          icon: 'icon-tool-freehand-roi',
          label: 'Freehand ROI',
          tooltip: 'Freehand ROI',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'SplineROI',
          icon: 'icon-tool-spline-roi',
          label: 'Spline ROI',
          tooltip: 'Spline ROI',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'LivewireContour',
          icon: 'icon-tool-livewire',
          label: 'Livewire tool',
          tooltip: 'Livewire tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'CobbAngle',
          icon: 'tool-angle-cobb',
          label: 'Cobb Angle',
          tooltip: 'Cobb Angle Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),

      ],
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'AutoZoom',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'auto-zoom',
      label: 'Auto Zoom',
      commands: 'autoZoomViewport',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'Reset',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-reset',
      label: 'Reset',
      commands: 'resetViewport',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'RemoveAnnotations',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'cancel',
      label: 'RemoveAnnotations',
      commands: 'removeAnnotations',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'StackScroll',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-stack-scroll',
      label: 'StackScroll',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // {
  //   id: 'SeriesScroll',
  //   uiType: 'ohif.radioGroup', // Use custom type
  //   props: {
  //     icon: 'tool-stack-scroll',
  //     commands: 'toggleSeriesScroll',
  //     label: 'Global Stack Scroll',
  //     evaluate: 'evaluate.action',
  //   },
  // },
  // Window Level
  {
    id: 'WindowLevel',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-window-level',
      label: 'Window Level',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Pan...
  {
    id: 'Pan',
    uiType: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: 'Pan',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // {
  //   id: 'CustomDragTool',
  //   uiType: 'ohif.radioGroup',
  //   props: {
  //     type: 'tool',
  //     icon: 'tool-move',
  //     label: 'CustomDragTool',
  //     commands: setToolActiveToolbar,
  //     evaluate: 'evaluate.cornerstoneTool',
  //   },
  // },
  {
    id: 'TrackballRotate',
    uiType: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-3d-rotate',
      label: '3D Rotate',
      commands: setToolActiveToolbar,
      evaluate: {
        name: 'evaluate.cornerstoneTool',
        disabledText: 'Select a 3D viewport to enable this tool',
      },
    },
  },
  {
    id: 'SyncGroup',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'SyncGroup',
      // Add evaluate for the group to switch primary button
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
      primary: createButton({
        id: 'NoSync',
        icon: 'tool-sync',
        label: 'No Sync',
        tooltip: 'No Sync',
        commands: [
          {
            commandName: 'toggleSynchronizer',
            commandOptions: {
              type: 'imageSlice',
              enabled: false,
              syncMode: 'none'
            },
          },
        ],
        evaluate: 'evaluate.cornerstone.synchronizer',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'More Sync Options',
      },
      items: [
        createButton({
          id: 'NoSync',
          icon: 'tool-no-sync', // normal sync icon but grayed out
          label: 'No Sync',
          tooltip: 'No Sync',
          commands: [
            {
              commandName: 'toggleSynchronizer',
              commandOptions: {
                type: 'imageSlice',
                enabled: false,
                syncMode: 'none'
              },
            },
          ],
          evaluate: 'evaluate.cornerstone.synchronizer',
        }),
        createButton({
          id: 'AutoSync',
          icon: 'tool-sync', // normal sync icon
          label: 'Auto Sync',
          tooltip: 'Auto Sync',
          commands: [
            {
              commandName: 'toggleSynchronizer',
              commandOptions: {
                type: 'imageSlice',
                enabled: true,
                syncMode: 'auto'
              },
            },
          ],
          evaluate: 'evaluate.cornerstone.synchronizer',
        }),
        createButton({
          id: 'ManualSync',
          icon: 'manual-sync', // normal sync icon with a hand/click indicator
          label: 'Manual Sync',
          tooltip: 'Manual Sync - Click corresponding points to sync',
          commands: [
            {
              commandName: 'toggleSynchronizer',
              commandOptions: {
                type: 'imageSlice',
                enabled: true,
                syncMode: 'manual'
              },
            },
          ],
          evaluate: 'evaluate.cornerstone.synchronizer',
        }),
      ],
    },
  },
  {
    id: 'Capture',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      commands: 'showDownloadViewportModal',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'Layout',
    uiType: 'ohif.layoutSelector',
    props: {
      rows: 3,
      columns: 4,
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'Crosshairs',
    uiType: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: {
        commandName: 'setToolActiveToolbar',
        commandOptions: {
          toolGroupIds: ['mpr'],
        },
      },
      evaluate: {
        name: 'evaluate.cornerstoneTool',
        disabledText: 'Select an MPR viewport to enable this tool',
      },
    },
  },
];

export default toolbarButtons;
