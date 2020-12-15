const { MIME_TYPE_EPUB, UPLOAD_PATH, UPLOAD_URL } = require('../utils/constant')
const fs = require('fs')
// 引入epub.
const Epub = require('../utils/epub')
// 引入xml.
const xml2js = require('xml2js').parseString
// 引入path
const path = require('path')

class Book {
  constructor(file, data) {
    if (file) {
      this.createBookFromFile(file)
    } else {
      this.createBookFromData(data)
    }
  }

  /**
   * 从页面file创建Book.
   * @param file
   */
  createBookFromFile(file) {
    // 获取file参数.
    const {
      destination,
      filename,
      mimetype = MIME_TYPE_EPUB,
      path,
      originalname
    } = file

    const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
    // 电子书原有路径.
    const oldBookPath = path
    // 电子书的新路径.
    const bookPath = `${destination}/${filename}${suffix}`
    // 电子书的下载URL.
    const url = `${UPLOAD_URL}/book/${filename}${suffix}`
    // 电子解压后的文件夹路径.
    const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
    // 电子解压后的文件夹URL.
    const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`

    // 校验解压文件夹.
    if (!fs.existsSync(unzipPath)) {
      fs.mkdirSync(unzipPath, { recursive: true})
    }

    // 文件名重命名.
    if (fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
      fs.renameSync(oldBookPath, bookPath)
    }

    // 值设置.
    // 文件名.
    this.fileName = filename
    // epub文件相对路径.
    this.path = `/book/${filename}${suffix}`
    // 文件路径.
    this.filePath = this.path
    // 解压路径.
    this.unzipPath = `/unzip/${filename}`
    // epub文件下载URL.
    this.url = url
    // 书名.
    this.title = ''
    // 作者.
    this.author = ''
    // 出版社.
    this.publisher = ''
    // 目录.
    this.contents = []
    // 树状目录结构.
    this.contentsTree = []
    // 封面图片URL.
    this.cover = ''
    // 封面图片下载路径
    this.coverPath = ''
    // 分类ID.
    this.category = -1
    // 分类名称.
    this.categoryText = ''
    // 语言.
    this.language = ''
    // 解压后文件夹URL.
    this.unzipUrl = unzipUrl
    // 电子书原始名称.
    this.originalName = originalname
  }

  /**
   * 从解析数据创建Book.
   * @param data
   */
  createBookFromData(data) {
    this.fileName = data.fileName
    this.cover = data.cover
    this.title = data.title
    this.author = data.author
    this.publisher = data.publisher
    this.bookId = data.fileName
    this.language = data.language
    this.originalName = data.originalName
    this.path = data.path || data.filePath
    this.filePath = data.path || data.filePath
    this.unzipPath = data.unzipPath
    this.coverPath = data.coverPath
    this.createUser = data.username
    this.createDt = new Date().getTime()
    this.updateDt = new Date().getTime()
    this.updateType = data.updateType === 0 ? data.updateType : 1
    this.category = data.category || 99
    this.categoryText = data.categoryText || '自定义'
    this.contents = data.contents || []
  }

  /**
   * epub解析.
   * @returns {Promise<unknown>}
   */
  parse() {
    return new Promise((resolve, reject) => {
      // 电子书路径.
      const bookPath = `${UPLOAD_PATH}${this.filePath}`
      // 电子书不存在.
      if (!fs.existsSync(bookPath)) {
        // 抛出异常.
        reject(new Error('电子书不存在'))
      }

      // 解析epub.
      const epub = new Epub(bookPath)
      epub.on('error', error => {
        reject(error)
      })

      epub.on('end', error => {
        if (error) {
          reject(error)
        } else {
          // 获取epub内容.
          const {
            title,
            creator,
            creatorFileAs,
            language,
            cover,
            publisher
          } = epub.metadata

          if (!title) {
            reject(new Error('图书标题为空'))
          } else {
            this.title = title
            this.language = language || 'en'
            this.author = creator || creatorFileAs || 'unknown'
            this.publisher = publisher || 'unknown'
            this.rootFile = epub.rootFile

            try {
              // 解压电子书.
              this.unzip()
              // 解析电子书内容.
              this.parseContents(epub).then(({ chapters, chapterTree }) => {
                // 目录结构.
                this.contents = chapters
                // 树状目录结构.
                this.contentsTree = chapterTree

                // epub设置方法可能不一样.要修改源码.
                epub.getImage(cover, handleGetImage)
              })

              /**
               * 解析电子书封面图片.
               * @param error
               * @param file
               * @param mineType
               */
              const handleGetImage = (error, file, mineType) => {
                if (error) {
                  reject(error)
                } else {
                  // 封面图片后缀名.
                  const suffix = mineType.split('/')[1]
                  const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`
                  const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`
                  // 写入图片.
                  fs.writeFileSync(coverPath, file, 'binary')
                  this.coverPath = `/img/${this.fileName}.${suffix}`
                  this.cover = coverUrl
                  resolve(this)
                }
              }
            } catch (e) {
              reject(e)
            }
          }
        }
      })

      // 启动epub解析.
      epub.parse()
    })
  }

  /**
   * epub电子书解压.
   */
  unzip() {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(Book.genPath(this.path))
    // 解压并覆盖.
    zip.extractAllTo(Book.genPath(this.unzipPath), true)
  }

  /**
   * 解析电子书内容.
   * @param epub
   */
  parseContents(epub) {
    function getNcxFilePath() {
      const spine = epub && epub.spine
      const manifest = epub && epub.manifest
      const ncx = spine.toc && spine.toc.href
      const id = spine.toc && spine.toc.id
      if (ncx) {
        return ncx
      } else {
        return manifest[id].href
      }
    }

    /**
     * 查找父节点.
     * @param array
     * @returns
     */
    function findParent(array, level = 0, pid = '') {
      return array.map(item => {
        item.level = level
        item.pid = pid
        if (item.navPoint && item.navPoint.length > 0) {
          // 多级目录时,进行迭代.
          item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
        } else if (item.navPoint) {
          item.navPoint.level = level + 1
          item.navPoint.id = item['$'].id
        }

        return item
      })
    }

    /**
     * 数据扁平处理.
     * @param array
     * @returns {*[]}
     */
    function flatten(array) {
      return [].concat(...array.map(item => {
        if (item.navPoint && item.navPoint.length > 0) {
          // 多级目录,进行迭代.
          return [].concat(item, ...flatten(item.navPoint))
        } else if (item.navPoint) {
          return [].concat(item, item.navPoint)
        }
        return item
      }))
    }

    // 获取目录路径.
    const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)
    if (fs.existsSync(ncxFilePath)) {
      return new Promise((resolve, reject) => {
        // 读取xml内容.
        const xml = fs.readFileSync(ncxFilePath, 'utf-8')
        // 目录dir.
        const dir = path.dirname(ncxFilePath).replace(UPLOAD_PATH, '')
        // 文件名.
        const fileName = this.fileName
        // 解压路径.
        const unzipPath = this.unzipPath
        // xml -> json.
        xml2js(xml, {
          explicitArray: false,
          ignoreAttrs: false
        }, function(error, json) {
          if (error) {
            reject(error)
          } else {
            const navMap = json.ncx.navMap
            if (navMap.navPoint && navMap.navPoint.length > 0) {
              navMap.navPoint = findParent(navMap.navPoint)
              const newNavMap = flatten(navMap.navPoint)
              // 目录.
              const chapters = []
              newNavMap.forEach((chapter, index) => {
                const src = chapter.content['$'].src
                // ID.
                chapter.id = `${src}`
                // href.
                chapter.href = `${dir}/${src}`.replace(unzipPath, '')
                // text.
                chapter.text = `${UPLOAD_URL}${dir}/${src}`
                // 目录标题.
                chapter.label = chapter.navLabel.text || ''
                // 目录ID.
                chapter.navId = chapter['$'].id
                // 目录名.
                chapter.fileName = fileName
                // 目录顺序.
                chapter.order = index + 1
                chapters.push(chapter)
              })

              // const chapterTree = []
              // // 目录解析.
              // chapters.forEach(c => {
              //   c.children = []
              //   if (c.pid === '') {
              //     chapterTree.push(c)
              //   } else {
              //     const parent = chapters.find( _ => _.navId === c.pid)
              //     parent.children.push(c)
              //   }
              // })

              // 获取电子书目录.
              const chapterTree = Book.getContentsTree(chapters)

              // 将目录结构返回.
              resolve({ chapters, chapterTree })
            } else {
              reject(new Error('目录解析失败, 目录数为0'))
            }
          }
        })
      })
    } else {
      throw new Error('目录文件不存在')
    }
  }

  /**
   * 将book对象转换成db对象.
   */
  toDb() {
    return {
      fileName: this.fileName,
      cover: this.cover,
      title: this.title,
      author: this.author,
      publisher: this.publisher,
      bookId: this.fileName,
      language: this.language,
      originalName: this.originalName,
      filePath: this.filePath,
      unzipPath: this.unzipPath,
      coverPath: this.coverPath,
      createUser: this.createUser,
      createDt: this.createDt,
      updateDt: this.updateDt,
      updateType: this.updateType,
      category: this.category,
      categoryText: this.categoryText
    }
  }

  /**
   * 获取电子书目录内容.
   * @returns {[]|*[]}
   */
  getContents() {
    return this.contents
  }

  /**
   * 重置电子书内容.
   */
  reset() {
    if (Book.pathExists(this.filePath)) {
      // 删除电子书.
      fs.unlinkSync(Book.genPath(this.filePath))
    }
    if (Book.pathExists(this.coverPath)) {
      // 删除封面图片文件.
      fs.unlinkSync(Book.genPath(this.coverPath))
    }
    if (Book.pathExists(this.unzipPath)) {
      // 删除解压电子书.
      // 低版本中的 node 中 recursive 不支持.
      fs.rmdirSync(Book.genPath(this.unzipPath), { recursive: true })
    }
  }

  /**
   * 获取文件路径.
   * @param path
   * @returns {string}
   */
  static genPath(path) {
    if (!path.startsWith('/')) {
      path = `/${path}`
    }
    return `${UPLOAD_PATH}${path}`
  }

  /**
   * 判断文件夹路径是否存在.
   * @param path
   * @returns {boolean}
   */
  static pathExists(path) {
    if (path.startsWith(UPLOAD_PATH)) {
      return fs.existsSync(path)
    } else {
      return fs.existsSync(Book.genPath(path))
    }
  }

  /**
   * 获取电子书目录.
   * @param book
   * @returns {null|[]}
   */
  static getContentsTree(contents) {
    if (contents) {
      // 电子书树状目录.
      const contentsTree = []
      // 目录解析.
      contents.forEach(c => {
        c.children = []
        if (c.pid === '') {
          contentsTree.push(c)
        } else {
          const parent = contents.find(_ => _.navId === c.pid)
          parent.children.push(c)
        }
      })
      return contentsTree
    } else {
      return null
    }
  }
}

module.exports = Book