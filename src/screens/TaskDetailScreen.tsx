import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useFocusEffect } from '@react-navigation/native';
import {
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import { RichEditor } from 'react-native-pell-rich-editor';
import ImageView from 'react-native-image-viewing';

import { useAppRoutes } from '../hooks/useAppRoute';
import {
  addComment,
  getTask,
  tasksCommentsRef,
  updateTask,
} from '../firebase/taskCollection';
import { CommentType, TaskStatusEnum, TaskType } from '../types/appTypes';
import appColors from '../styles/appColors';
import {
  BaseButton,
  BaseHtmlText,
  BaseIcon,
  BaseLoader,
  BaseModal,
  BaseRichTextInput,
} from '../components';
import {
  sendNotification,
  timestampToDate,
  toCapitalize,
} from '../utils/helperFunctions';
import appFonts from '../styles/appFonts';
import { useAppSelector } from '../hooks/reduxHooks';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { uploadFilesToSupabase } from '../supabase';
import { UploadFileType } from '../components/BaseRichTextInput';

const TaskDetailScreen = () => {
  const navigation = useAppNavigation('TaskDetail');

  const { user } = useAppSelector(state => state.AuthReducer);
  const { params } = useAppRoutes<'TaskDetail'>();

  const richTextRef = useRef<RichEditor>(null);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<UploadFileType[]>([]);
  const [modelVisible, setModelVisible] = useState(false);
  const [task, setTask] = useState<TaskType>();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCmtLoading, setIsAddCmtLoading] = useState(false);
  const [viewImage, setViewImage] = useState(false);

  const TASK_OWNER = useMemo(() =>  task?.created_by === user?.id, [task]);

  useFocusEffect(
    useCallback(() => {
      getTask(params.id)
        .then(res => {
          setTask(res);
          setIsLoading(false);
        })
        .catch(er => {
          console.log({ er });
          setIsLoading(false);
        });
    }, []),
  );

  useEffect(() => {
    const q = query(
      tasksCommentsRef,
      where('task_id', '==', params.id),
      orderBy('created_at', 'desc'),
    );

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const commentList: CommentType[] = [];
      querySnapshot.forEach((doc: any) => commentList.push(doc.data()));
      setComments(commentList);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const taskColor =
    task?.task_status === TaskStatusEnum.DONE
      ? { iconText: appColors.TASK_DONE, background: appColors.TASK_DONE_BG }
      : task?.task_status === TaskStatusEnum.IN_PROGRESS
      ? {
          iconText: appColors.TASK_IN_PROGRESS,
          background: appColors.TASK_IN_PROGRESS_BG,
        }
      : { iconText: appColors.TASK_TODO, background: appColors.TASK_TODO_BG };

  const handleAddComment = async () => {
    setIsAddCmtLoading(true);
    const commentData: Partial<CommentType> = {
      task_id: task?.id,
      author: user?.name,
      author_id: user?.id,
      message: comment,
    };
    if (files.length) {
      const urlList = await uploadFilesToSupabase(files);
      commentData.file_url = urlList;
    }
    
    addComment(commentData)
      .then(() => {
        sendNotification({
          body: `Comment for Task: ${task?.title}`,
          data: {
            task_id: task?.id,
          },
          title: 'New Comment',
          user_id: TASK_OWNER
            ? task?.assigned_to ?? ''
            : task?.created_by ?? '',
        });
        setIsAddCmtLoading(false);
        toggleModal();
        setComment('');
      })
      .catch(error => {
        Alert.alert('Add Comment', 'Something went wrong');
        setIsAddCmtLoading(false);
        toggleModal();
        setComment('');
      });
  };

  const toggleModal = () => setModelVisible(!modelVisible);

  const handleConfirm = (type: 'ARCHIVE' | 'DELETE' | 'RESTORE') => {
    const title = type === 'ARCHIVE' ? 'Task Archive' : 'Task Delete';
    const msg =
      type === 'ARCHIVE'
        ? 'Are you sure to archive this task?'
        : 'Are you sure to delete this task?';
    Alert.alert(title, msg, [
      {
        text: 'No',
      },
      {
        text: 'Yes',
        onPress: () => handleOperation(type),
      },
    ]);
  };

  const handleOperation = (operation: 'ARCHIVE' | 'DELETE' | 'RESTORE') => {
    setIsLoading(true);
    const data: Partial<TaskType> =
      operation === 'DELETE'
        ? { is_deleted: true }
        : { is_archived: operation === 'ARCHIVE' ? true : false };
    updateTask(task?.id ?? '', data).then(() => {
      setIsLoading(false);
      navigation.goBack();
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isLoading ? (
        <BaseLoader />
      ) : !task ? (
        <Text>{'Task not found'}</Text>
      ) : (
        <>
          <View style={styles.statusHeaderContainer}>
            <View style={{}}>
              <Text
                style={[
                  styles.taskStatus,
                  {
                    color: taskColor.iconText,
                    backgroundColor: taskColor.background,
                  },
                ]}
              >
                {task?.task_status && toCapitalize(task?.task_status)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              {TASK_OWNER && (
                <>
                  <Text
                    style={[styles.linkText, { color: appColors.DANGER_TEXT }]}
                    onPress={() => handleConfirm('DELETE')}
                  >
                    {'Delete'}
                  </Text>
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      handleConfirm(task?.is_archived ? 'RESTORE' : 'ARCHIVE')
                    }
                  >
                    {task?.is_archived ? 'Restore' : 'Archive'}
                  </Text>
                </>
              )}
              <Text
                style={styles.linkText}
                onPress={() => {
                  navigation.navigate('TaskForm', {
                    task: task,
                    projectId: task?.project_id,
                  });
                }}
              >
                {TASK_OWNER ? 'Edit' : 'Update Status'}
              </Text>
            </View>
          </View>
          <Text style={styles.taskTitle}>{task?.title}</Text>
          <View style={styles.projectRow}>
            <BaseIcon name="FolderOpen" color={appColors.SECONDARY_TEXT} />
            <Text style={styles.projectTitle}>{task?.project_title}</Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.fieldHeader}>{'Description'}</Text>
            <BaseHtmlText html={task?.description ?? ''} />
            {task?.file_url?.length && (
              <Pressable onPress={() => setViewImage(true)}>
                <Image
                  source={{
                    uri: task?.file_url[0],
                    width: wp(20),
                    height: wp(20),
                  }}
                />
              </Pressable>
            )}
            {task?.file_url?.length && (
              <ImageView
                images={task?.file_url.map(uri => ({ uri }))}
                imageIndex={0}
                visible={viewImage}
                onRequestClose={() => setViewImage(false)}
              />
            )}
          </View>

          <Text style={styles.fieldHeader}>
            {'Assigned to '}
            <Text style={styles.assignMember}>{task?.assigned_member}</Text>
            {' on '}
            <Text style={styles.assignMember}>
              {timestampToDate(task?.created_at)}
            </Text>
          </Text>

          <View style={styles.commentHeaderRow}>
            <Text style={styles.fieldHeader}>{'Comments'}</Text>
            <Text style={styles.linkText} onPress={toggleModal}>
              {'+ Add Comment'}
            </Text>
          </View>
          {(comments?.length ?? 0) > 0 ? (
            comments.map(comment => (
              <View
                style={[
                  styles.commentBox,
                  user?.id === comment.author_id && {
                    borderColor: appColors.PRIMARY,
                  },
                ]}
              >
                <Text style={styles.authorName}>{comment.author}</Text>
                <BaseHtmlText html={comment.message} />
                {comment.file_url?.length && (
                  <Pressable onPress={() => setViewImage(true)}>
                    <Image
                      source={{
                        uri: comment.file_url[0],
                        width: wp(20),
                        height: wp(20),
                      }}
                    />
                  </Pressable>
                )}
                {comment.file_url?.length && (
                  <ImageView
                    images={comment.file_url.map(uri => ({ uri }))}
                    imageIndex={0}
                    visible={viewImage}
                    onRequestClose={() => setViewImage(false)}
                  />
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyComments}>{'There are no comments'}</Text>
          )}
        </>
      )}
      <BaseModal
        visible={modelVisible}
        onRequestClose={toggleModal}
        modalTitle="Add Comment"
      >
        {isAddCmtLoading && <BaseLoader />}
        <BaseRichTextInput
          ref={richTextRef}
          initialContentHTML={comment}
          title="Comment"
          onChange={text => setComment(text)}
          placeholder="Enter Task Comment"
          shouldAddFile
          onFileSelect={res => {
            res && setFiles([res]);
          }}
        />
        <BaseButton
          title="Add Comment"
          onPress={handleAddComment}
          style={{ width: wp(82), marginTop: hp(2) }}
          disabled={!comment.trim().length}
        />
      </BaseModal>
    </ScrollView>
  );
};

export default TaskDetailScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: wp(3),
    gap: hp(1),
    paddingBottom: hp(5),
  },
  statusHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkText: {
    color: appColors.PRIMARY,
    fontWeight: '500',
    marginHorizontal: wp(2),
  },
  taskStatus: {
    alignSelf: 'flex-start',
    padding: wp(1),
    paddingHorizontal: wp(3),
    borderRadius: wp(10),
  },
  taskTitle: {
    fontSize: appFonts.FONT_16,
    fontWeight: '500',
  },
  projectRow: {
    flexDirection: 'row',
    gap: wp(1.5),
  },
  projectTitle: {
    color: appColors.PRIMARY_TEXT,
  },
  descriptionContainer: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    padding: wp(3),
    borderRadius: wp(3),
    elevation: 5,
    marginVertical: hp(1),
  },
  assignMember: {
    color: appColors.PRIMARY_TEXT,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentBox: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    padding: wp(2),
    borderRadius: wp(2),
    elevation: 3,
    borderWidth: 1,
  },
  authorName: {
    fontSize: appFonts.FONT_10,
    color: appColors.SECONDARY_TEXT,
    fontWeight: '500',
  },
  fieldHeader: {
    color: appColors.SECONDARY_TEXT,
    fontWeight: 'bold',
  },
  emptyComments: { textAlign: 'center', marginVertical: hp(1) },
  modalView: {
    flex: 1,
    justifyContent: 'center',
  },
  closeIcon: {
    alignSelf: 'flex-end',
  },
  modalContentView: {
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    padding: wp(4),
    margin: wp(4),
    borderRadius: wp(3),
    gap: hp(1),
  },
  modalTitle: {
    fontSize: appFonts.FONT_16,
    fontWeight: '500',
  },
  textArea: {
    height: hp(10),
    textAlignVertical: 'top',
  },
});
